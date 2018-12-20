'use strict';

const enums = require('./constants');

// const net = require('net');
// const semver = require('semver');
const debug = require('debug')('busy:bridge');

const Message = require('./message.js');
const noop = require('./noop');
const extend = require('gextend');
const Keypath = require('gkeypath');

const utils = require('./utils');

const DEFAULTS = {
    host: '127.0.0.1',
    port: enums.DEFAULT_PORT
};

class Bridge {

    constructor(config = {}, cb = noop) {

        if (utils._isNumber(config)) {
            config = { port: config };
        }

        if (utils._isFunction(config)) {
            cb = config;
            config = {};
        }

        /*
         * In theory, if we have path, port,
         * and host the path should take
         * precedence. Not happening, tho.
         */
        if (!config.path) {
            config = extend({}, {
                host: '127.0.0.1',
                port: enums.DEFAULT_PORT
            }, config);
        }

        this._config = config;

        this._sockets = new Map();
        this._server = require('./transport').createServer(this._onConnection.bind(this));

        this._server.once('error', cb);
        this._server.once('listening', cb);
        this._server.listen(config);
    }

    /**
     * This function will close the connection
     * with a last message.
     * @param  {Array} closeData
     * @return {void}
     */
    close(closeData) {

        const msg = new Message(enums.CLOSE, utils._isArray(closeData) ? closeData : []);

        for (let nodeName in this._sockets.keys()) {
            this._sendToNode(nodeName, msg);
        }

        this._server.close();
    }

    _onConnection(socket) {
        debug('new node (%s:%s)', socket.remoteAddress, socket.remotePort);
        socket.setEncoding('utf8');
        socket.setTimeout(0);
        socket.on('data', this._onData.bind(this, socket));
        socket.on('error', this._cleanUpSocketConnection.bind(this, socket));
    }

    _onData(socket, rawData) {
        const self = this;

        try {
            const events = rawData.split(enums.EOL);
            debug('raw data is: %s. Events: %s', rawData, events.length);

            events.forEach(event => {
                //Char LF, code 10 is a line feed
                if (!event || event.charCodeAt(0) === 10) {
                    return;
                }

                debug('node --> bridge: %s', event);

                const message = Message.fromString(event);

                switch (message.method) {
                    case enums.PING:
                        self._onPingMessage(socket, message);
                        break;
                    case enums.IDENT:
                        self._onIdentityMessage(socket, message);
                        break;
                    case enums.TELL:
                        self._onTellMessage(socket, message);
                        break;
                    case enums.SHOUT:
                        self._onShoutMessage(socket, message);
                        break;
                    case enums.ACK:
                        self._onACKMessage(socket, message);
                        break;
                    case enums.LEAVE:
                        self._onLeaveMessage(socket, message);
                        break;
                    default:
                        debug('received unrecognized command: %s', message.method);
                }
            });
        } catch (e) {
            debug('error: %s', e.message)
            return debug('bridge received invalid data, ignoring...');
        }
    }

    /**********************************************************
     * Command Handlers
     ***********************************************************/

    /**
     * We handle a simple ping/pong pattern 
     * between nodes.
     * 
     * @param {Socket} socket Node instance to write to
     * @param {Message} message Message to serialzie and wire
     */
    _onPingMessage(socket, message) {
        this._writeToSocket(socket, 'pong');
    }


    /**
     * A new node is registering with the group.
     * It might be that a node is reconnecting but
     * we have not removed it before, in that 
     * case we reconnect.
     * 
     * @param {Socket} socket Node instance to write to
     * @param {Message} message Message to serialzie and wire
     */
    _onIdentityMessage(socket, message) {
        if (this._sockets.has(message.nodeName)) {
            //TODO: Check if we are reconnecting, and if so then swap.
            debug('duplicate node name: %s', message.nodeName);
            this._writeToSocket(socket, new Message(enums.ACK, [message.id, ['duplicate-node']]));
        } else {
            socket.nodeName = message.nodeName;
            this._sockets.set(message.nodeName, socket);

            //This won't be called sometimes, we need better handling
            socket.on('close', this._cleanUpSocketConnection.bind(this, socket));

            debug('sending ACK (id: %s)', message.id);

            this._sendToNode(message.nodeName, new Message(enums.ACK, [message.id, [null]]));
        }
    }

    /**
     * This acts as a broadcast, we send the message to 
     * all nodes in the network.
     * 
     * @param {Socket} socket Node instance to write to
     * @param {Message} message Message to serialzie and wire
     */
    _onShoutMessage(socket, message) {
        const msg = new Message(enums.SHOUT, message.data);

        for (let nodeName in this._sockets.keys()) {
            if (nodeName === message.nodeName) {
                continue;
            }
            this._sendToNode(nodeName, msg);
        }
    }

    _onACKMessage(socket, message) {
        const [to, cbid, params] = message.data;
        this._sendToNode(to, new Message(enums.ACK, [cbid, params]));
    }

    _onTellMessage(socket, message) {
        const [nodeName, nodeEvent, params] = message.data;

        if (!this._sockets.has(nodeName)) {
            debug('attempting to "publish" a non-existent node: %s', nodeName);
            this._sendToNode(message.nodeName, new Message(enums.ACK, [message.id, ['unknown-node']]));
        } else {
            this._sendToNode(nodeName, new Message(enums.TELL, [message.nodeName, message.id, nodeEvent, params]));
        }
    }

    _onLeaveMessage(socket, message) {
        this._writeToSocket(socket, new Message(enums.ACK, [message.id, []]));
        this._cleanUpSocketConnection(socket);
    }

    /**********************************************************
     * Write and Socket Management Functions
     ***********************************************************/

    _sendToNode(name, what) {
        if (this._sockets.has(name)) {
            this._writeToSocket(this._sockets.get(name), what);
        } else {
            debug('tried to write to an unregistered socket');
        }
    }

    _writeToSocket(socket, what) {
        try {
            socket.write(what.toString());
        } catch (e) {
            debug('tried to write to dead socket');
            this._cleanUpSocketConnection(socket);
        }
    }

    _cleanUpSocketConnection(socket) {
        const name = this.getSocketName(socket);
        if (name) {
            this._sockets.delete(name);
            debug('Node "%s" has left. Cleaning up...', name);
        }
        socket.removeAllListeners();
    }

    getSocketName(socket) {
        for (let name in this._sockets.keys()) {
            if (socket === this._sockets.get(name)) {
                return name;
            }
        }
        return null;
    }
}

module.exports = Bridge;