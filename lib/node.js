'use strict';

const enums = require('./constants');

const uuid = require('uuid');
const debug = require('debug')('flic:node');
const Message = require('./message');
const noop = require('./noop');
const EventEmitter = require('events');
const net = require('net');
const extend = require('gextend');
const Keypath = require('gkeypath');


function _isPlainObject(o) {
    return typeof o === 'object';
}
function _isString(s){
    return typeof s === 'string';
}
function _isFunction(f){
    return typeof f === 'function';
}
function _isNumber(n){
    return typeof n === 'number';
}
function _last(a){
    return a[a.length - 1];
}
function _isArray(a){
    return Array.isArray(a);
}

function _get(o, keypath, def) {
    return Keypath.get(o, keypath, def);
}

class Node extends EventEmitter {
    constructor(config) {
        super();

        if (!_isPlainObject(config)) {
            config = {};
            var args = [].slice.call(arguments);
            args.map((arg)=>{
                if (_isString(arg)) {
                    return config.id = arg;
                }
                if (_isNumber(arg)) {
                    return config.port = arg;
                }
                if (_isFunction(arg)) {
                    config.connect_callback = arg;
                }
            });
        }

        config = extend({}, {
            id: uuid.v4(),
            port: enums.DEFAULT_PORT,
            'connect_callback': noop,
            'max_connectionAttempts': 5,
            timeout: 0
        }, config);

        this._config = config;

        // Set up an array to store waiting callbacks
        this._waiters = {};
        this._isConnected = false;
        this._connectionAttempts = 0;
        this._connectBridge();
    }

    _connectBridge() {
        if (this._bridge) {
            this._bridge.removeAllListeners();
        }
        this._bridge = null;

        // Lets connect to the Bridge
        let config = {path: '/tmp/kaka.sock'};
        this._bridge = net.connect(config);

        this._bridge.setTimeout(this._config.timeout);
        this._bridge.on('data', this._onData.bind(this));
        this._bridge.on('connect', this._onConnect.bind(this));
        this._bridge.on('error', this._onSocketError.bind(this));
    }

    _onConnect() {
      // Set hasConnected to true, so if the socket errors out we won't attempt
      // to reconnect.
        this._isConnected = true;

        var ident, messageId;

        // Identify the node to the bridge
        debug('sending IDENT');

        // Create a new Message
        ident = new Message(enums.IDENT);

        // Get the ID of the message so we can store the callback as a waiter
        messageId = ident.getId();

        // store the callback in the waiters list
        this._waiters[messageId] = this._config.connect_callback;

        // tell the bridge
        this._writeBridge(ident);
    }

    _onSocketError(e) {
        var self = this;
        debug('%s', e);

        if (!this._isConnected) {
            this._connectionAttempts++;
            if (this._connectionAttempts < this._config.max_connectionAttempts) {
                debug('attempting to reconnect... (try number: %d)', this._connectionAttempts);
                setTimeout(function () {
                    self._connectBridge();
                }, this._connectionAttempts * enums.CONNECT_BACKOFF_MULT);
            } else {
                this._config.connect_callback('error: node could not connect to bridge!');
            }
        } else {
            this.emit('error', e);
        }
    }

    _onData(rawData) {
        var self = this;

        try {
            var events = rawData.toString().split('\0');

            events.forEach(function (event) {
                if (!event) {
                    return
                }

                debug('node <-- bridge: %s', event);
                var message = JSON.parse(event);

                switch (_get(message, 'method')) {
                    case enums.ACK:
                        self._onACKMessage(message);
                        break;
                    case enums.TELL:
                        self._onTellMessage(message);
                        break;
                    case enums.SHOUT:
                        self._onShoutMessage(message);
                        break;
                    case enums.CLOSE:
                        self._onCloseMessage(message);
                        break;
                }
            });
        } catch (e) {
            return debug('node received invalid data, ignoring...');
        }
    }

    _onACKMessage(message) {
        debug('received ACK from Bridge for message: %s', message.data[0]);
        // Save the message ack id - we'll be plucking it from the array later.
        var mid = message.data[0];
        var handler = this._waiters[mid] || noop;
        var data = message.data[1] || [];
        handler.apply(this, data);

        delete this._waiters[mid];
    }

    _onTellMessage(message) {
        var self = this;
        var from = message.data[0];
        var cbid = message.data[1];
        var eventName = message.data[2];
        var params = message.data[3];

        debug('received TELL(%s) from %s', eventName, from);

      // Define a callback function that can be called by a receiving function
        var cb = function () {
            // grab all the args
            var args = [].slice.call(arguments);

            // construct the message
            var msg = new Message(enums.ACK, [from, cbid, args]);

            // send the message
            self._writeBridge(msg);
        };

        // push the callback to the end of the params array
        params.push(cb);

        // push the event name to the beginning
        params.unshift(eventName);

        // emit that!
        this.emit.apply(this, params);
    }

    _onShoutMessage (message) {
        debug('received SHOUT(%s)', message.data[0]);
        this.emit.apply(this, message.data);
    }

    _onCloseMessage (message) {
        debug('received CLOSE');
        message.data.unshift(enums.CLOSE.toLowerCase());
        this.emit.apply(this, message.data);
    }

    /**
     * Node#tell()
     * @param {string} whoWhat - the node name and event in the following format:
     * "node_name:event_name"
     * @param {csv} args - any amount of arguments to be sent along with the remote
     * event
     * @param {function} callback - a callback to be run when the remote event calls
     * its callback
     * @return {Node} - returns self for chainability
     */
    tell () {
        var self = this;
        var args = [].slice.call(arguments);
      // parse the arguments special array into a standard array

        // grab the who-what off the front
        var whoWhat = args.shift();

        var callback;

        // is there a function on the end here?
        if (_isFunction(_last(args))) {
            // cool, pop it off so we can store it in the waiters
            callback = args.pop();
        }

        var parts = whoWhat.split(':');

        if (parts.length !== 2) {
            throw new Error('Invalid tell statement, should be (node_name:event_name)');
        }

        var nodeName = parts[0];
        var eventName = parts[1];

        var destination = [nodeName, eventName, args];

        var tMsg = new Message(enums.TELL, destination);

        if (callback) {
            self._waiters[tMsg.getId()] = callback;
        }

        self._writeBridge(tMsg);
        return self;
    }

    shout () {
        this._writeBridge(new Message(enums.SHOUT, [].slice.call(arguments)));
        return this;
    }

    _writeBridge (msg) {
        msg.setNodeName(this._config.id);
        try {
            this._bridge.write(msg.toString());
        } catch (e) {
            this.emit('error', e);
        }
    }

    leave (force) {
        if (force) {
            debug('node force leaving');
            return this._forceLeave();
        }
        debug('node safely leaving');
        var self = this;
        var lvMsg = new Message(enums.LEAVE);
        this._waiters[lvMsg.getId()] = function () {
            this._forceLeave();
        };
        this._writeBridge(lvMsg);
        return self;
    }

    _forceLeave () {
        this._bridge.end();
        return this;
    }
}

module.exports = Node;
