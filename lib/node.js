'use strict';

const enums = require('./constants');
const exit = require('./cleanup');
const uuid = require('uuid');
const debug = require('debug')('busy:node');
const Message = require('./message');
const noop = require('./noop');
const EventEmitter = require('events');
const net = require('net');
const extend = require('gextend');
const Keypath = require('gkeypath');

const utils = require('./utils');

class Node extends EventEmitter {
    constructor(config, callback) {
        super();

        //TODO: Remove this!
        if (!utils._isObject(config)) {
            config = {};
            var args = [].slice.call(arguments);
            args.map(arg => {
                if (utils._isString(arg)) {
                    return config.id = arg;
                }
                if (utils._isNumber(arg)) {
                    return config.port = arg;
                }
                if (utils._isFunction(arg)) {
                    config.onConnect = arg;
                }
            });
        }

        if (callback) {
            config.onConnect = callback;
        }

        config = extend({}, {
            id: uuid.v4(),
            onConnect: noop,
            maxConnectionAttempts: 5,
            timeout: 0
        }, config);

        if (!config.port && !config.path) {
            config.port = enums.DEFAULT_PORT;
        }

        this._config = config;

        // Set up an object to store waiting callbacks
        this._callbacks = {};
        this._isConnected = false;
        this._connectionAttempts = 0;
        this._connectBridge();
    }

    /**
     * TODO: Rename to publish
     * Node#publish()
     * 
     * @param {string} whoWhat - the node name and event
     *                         in the following format:
     *                         "node_name:event_type"
     * @param {csv} args - any amount of arguments to be
     *                    sent along with the remote event
     * @param {function} callback - a callback to be run
     *                            when the remote event calls
     *                            its callback
     *
     * @return {Node}
     */
    publish( /*whoWhat, ...args, callback*/ ) {

        const self = this;
        const args = [].slice.call(arguments);
        // parse the arguments special array into a standard array

        // grab the who-what off the front
        const whoWhat = args.shift();

        let callback;

        // is there a function on the end here?
        if (utils._isFunction(utils._last(args))) {
            // cool, pop it off so we can store it in the waiters
            callback = args.pop();
        }

        //nodeName:eventName e.g. node1:ping
        const parts = whoWhat.split(':');

        if (parts.length !== 2) {
            throw new Error('Invalid publish statement, should be (node_name:event_name)');
        }

        const [nodeName, eventName] = parts;
        const destination = [nodeName, eventName, args];

        const msg = new Message(enums.TELL, destination);

        if (callback) {
            self._callbacks[msg.getId()] = callback;
        }

        self._writeBridge(msg);
        return self;
    }

    /**
     * 
     */
    broadcast() {
        this._writeBridge(new Message(enums.SHOUT, [].slice.call(arguments)));
        return this;
    }

    leave(force) {
        if (force) {
            debug('node force leaving');
            return this._forceLeave();
        }

        debug('node safely leaving');

        const msg = new Message(enums.LEAVE);

        this._callbacks[msg.getId()] = function() {
            this._forceLeave();
        };

        this._writeBridge(msg);

        return this;
    }

    _forceLeave() {
        this._bridge.end();
        this.emit('leave.force');
        return this;
    }

    _connectBridge() {
        if (this._bridge) {
            this._bridge.removeAllListeners();
        }

        this._bridge = null;

        // Lets connect to the Bridge
        this._bridge = net.connect(this._config);
        // this._bridge = require('./transport').createServer(this._onConnection.bind(this));

        this._registerSignalHandlers();

        this._bridge.setTimeout(this._config.timeout);
        this._bridge.on('data', this._onData.bind(this));
        this._bridge.on('connect', this._onConnect.bind(this));
        this._bridge.on('error', this._onSocketError.bind(this));
    }

    _onConnect() {
        // Set hasConnected to true, so if the socket errors out we won't attempt
        // to reconnect.
        this._isConnected = true;

        // Identify the node to the bridge
        debug('sending IDENT');

        // Create a new Message
        const ident = new Message(enums.IDENT);

        // Get the ID of the message so we can store the callback as a response
        const messageId = ident.getId();

        // store the callback in the waiters list
        this._callbacks[messageId] = this._config.onConnect;

        // publish the bridge
        this._writeBridge(ident);
    }

    _onSocketError(e) {
        debug('%s', e);

        if (!this._isConnected) {
            this._connectionAttempts++;
            if (this._connectionAttempts < this._config.maxConnectionAttempts) {
                debug('attempting to reconnect... (try number: %d)', this._connectionAttempts);
                setTimeout(_ => {
                    this._connectBridge();
                }, this._connectionAttempts * enums.CONNECT_BACKOFF_MULT);
            } else {
                this._config.onConnect('error: node could not connect to bridge!');
                this.emit('error.reconnect');
            }
        } else {
            this.emit('error', e);
        }
    }

    _onData(rawData) {
        try {
            const events = rawData.toString().split(enums.EOL);

            events.forEach(event => {
                if (!event || event.charCodeAt(0) === 10) {
                    return;
                }

                debug('node <-- bridge: %s', event);
                const message = Message.fromString(event);
                // var message = JSON.parse(event);

                switch (message.method) {
                    case enums.ACK:
                        this._onACKMessage(message);
                        break;
                    case enums.TELL:
                        this._onTellMessage(message);
                        break;
                    case enums.SHOUT:
                        this._onShoutMessage(message);
                        break;
                    case enums.CLOSE:
                        this._onCloseMessage(message);
                        break;
                }
            });
        } catch (e) {
            return debug('node received invalid data, ignoring...');
        }
    }

    /**********************************************************
     * Command Handlers
     ***********************************************************/

    _onACKMessage(message) {
        debug('received ACK from Bridge for message: %s', message.data[0]);
        // Save the message ack id - we'll be plucking it from the array later.
        const [mid, data = []] = message.data;
        const handler = this._callbacks[mid] || noop;

        //Handle message:
        handler.apply(this, data);

        //remove handler for this message
        delete this._callbacks[mid];
    }

    _onTellMessage(message) {
        var self = this;
        const [from, cbid, eventName, params] = message.data;

        debug('received TELL(%s) from %s', eventName, from);

        // Define a callback function that can be called by a receiving function
        // push the callback to the end of the params array
        params.push(() => {
            const args = [].slice.call(arguments);
            const msg = new Message(enums.ACK, [from, cbid, args]);
            this._writeBridge(msg);
        });

        // push the event name to the beginning
        params.unshift(eventName);

        this.emit.apply(this, params);
    }

    _onShoutMessage(message) {
        debug('received SHOUT(%s)', message.data[0]);
        this.emit.apply(this, message.data);
    }

    _onCloseMessage(message) {
        debug('received CLOSE');
        message.data.unshift(enums.CLOSE.toLowerCase());
        this.emit.apply(this, message.data);
    }

    /**
     * Send message over the wire.
     * We sign each message with the node's ID.
     * 
     * @param {Message} msg 
     */
    _writeBridge(msg) {
        msg.setNodeName(this._config.id);
        try {
            this._bridge.write(msg.toString());
        } catch (e) {
            this.emit('error', e);
        }
    }

    _registerSignalHandlers() {
        debug('register signal handlers...');
        exit(_ => {
            this._bridge.close();
        });
    }
}

module.exports = Node;