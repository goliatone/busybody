'use strict';

const enums = require('./constants');

const net = require('net');
const semver = require('semver');
const debug = require('debug')('busy:bridge');

const Message = require('./message.js');
const noop = require('./noop');
const extend = require('gextend');
const Keypath = require('gkeypath');

const utils = require('./utils');

class Bridge {

    constructor(config, cb) {

        if (utils._isNumber(config)) {
            config = { port: config };
        }
        if (utils._isFunction(config)) {
            cb = config;
            config = {};
        }

        if(!config.path) {
            config = extend({}, {
                host: '127.0.0.1',
                port: enums.DEFAULT_PORT
            }, config);
        }

        this._config = config;

        // store all of the sockets here
        this._sockets = {};
        this._server = net.createServer(this._onConnection.bind(this));

        this._server.once('error', cb || noop);

        var isOhTen = semver.major(process.version) === 0 && semver.minor(process.version) === 10;

        var args = [];
        if (isOhTen) {
            args.push(this._config.port, this._config.host);
        } else {
            args.push(this._config);
        }

        this._server.once('listening', cb || noop);

        // config = {path: '/tmp/kiko.sock'};
        this._server.listen.apply(this._server, [config]);
    }

    /**
     * This function will close the connection
     * with a last message.
     * @param  {Array} closeData
     * @return {void}
     */
    close(closeData) {

        let msg = new Message(enums.CLOSE, utils._isArray(closeData) ? closeData : []);

        for (var nodeName in this._sockets) {
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
        var self = this;

        try {
            var events = rawData.split(enums.EOL);
            debug('raw data is: %s. Events: %s', rawData, events.length);

            events.forEach(function (event) {
                if (!event || event.charCodeAt(0) === 10) {
                    return;
                }

                debug('node --> bridge: %s', event);

                var message = Message.fromString(event);

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

    _onPingMessage(socket, message) {
        this._writeToSocket(socket, 'pong');
    }

    _onIdentityMessage(socket, message) {
        if (utils._has(this._sockets, message.nodeName)) {
            debug('duplicate node name: %s', message.nodeName);
            this._writeToSocket(socket, new Message(enums.ACK, [message.id, ['duplicate-node']]));
        } else {
            socket.nodeName = message.nodeName;
            this._sockets[message.nodeName] = socket;
            socket.on('close', this._cleanUpSocketConnection.bind(this, socket));
            debug('sending ACK (id: %s)', message.id);
            this._sendToNode(message.nodeName, new Message(enums.ACK, [message.id, [null]]));
        }
    }

    _onShoutMessage(socket, message) {
        var msg = new Message(enums.SHOUT, message.data);
        for (var nodeName in this._sockets) {
            if (nodeName === message.nodeName) {
                continue;
            }
            this._sendToNode(nodeName, msg);
        }
    }

    _onACKMessage(socket, message) {
        var to = message.data[0];
        var cbid = message.data[1];
        var params = message.data[2];
        this._sendToNode(to, new Message(enums.ACK, [cbid, params]));
    }

    _onTellMessage(socket, message) {
        var nodeName = message.data[0];
        var nodeEvent = message.data[1];
        var params = message.data[2];
        if (!utils._has(this._sockets, nodeName)) {
            debug('attempting to "tell" a non-existent node: %s', nodeName);
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
    * Write Functions
    ***********************************************************/

    _sendToNode(name, what) {
        if (utils._has(this._sockets, name)) {
            this._writeToSocket(this._sockets[name], what);
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
        var name = getSocketName(this, socket);
        if (name) {
            delete this._sockets[name];
            debug('Node "%s" has left. Cleaning up...', name);
        }
        socket.removeAllListeners();
    }


}


function getSocketName (self, socket) {
    for (var _name in self._sockets) {
        if (socket === self._sockets[_name]) {
            return _name;
        }
    }
    return null;
}

module.exports = Bridge;
