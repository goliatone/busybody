'use strict';

const DEFAULT_PORT = 8221;
const TELL = 'TELL';
const SHOUT = 'SHOUT';
const IDENT = 'IDENT';
const ACK = 'ACK';
const CLOSE = 'CLOSE';
const LEAVE = 'LEAVE';

const net = require('net');
const semver = require('semver');
const debug = require('debug')('flic:bridge');

const Message = require('./message.js');
const noop = require('./noop');
const extend = require('gextend');
const Keypath = require('gkeypath');

function _isFunction(f){
    return typeof f === 'function';
}
function _isNumber(n){
    return typeof n === 'number';
}
function _isArray(a){
    return Array.isArray(a);
}
function _has(o, prop){
    return o[prop] !== undefined;
}

function _get(o, keypath, def) {
    return Keypath.get(o, keypath, def);
}

class Bridge {

    constructor(config, cb) {
        if (_isNumber(config)) {
            config = { port: config };
        }
        if (_isFunction(config)) {
            cb = config;
            config = {};
        }

        config = extend({}, {
            host: '127.0.0.1',
            port: DEFAULT_PORT
        }, config);

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
        this._server.listen.apply(this._server, args);
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
            var events = rawData.split('\0');

            events.forEach(function (event) {
                if (!event) {
                    return;
                }

                debug('node --> bridge: %s', event);
                var message = JSON.parse(event);

                switch (_get(message, 'method')) {
                    case IDENT:
                        self._onIdentityMessage(socket, message);
                        break;
                    case TELL:
                        self._onTellMessage(socket, message);
                        break;
                    case SHOUT:
                        self._onShoutMessage(socket, message);
                        break;
                    case ACK:
                        self._onACKMessage(socket, message);
                        break;
                    case LEAVE:
                        self._onLeaveMessage(socket, message);
                        break;
                    default:
                        debug('received unrecognized command: %s', _get(message, 'method'));
                }
            });
        } catch (e) {
            return debug('bridge received invalid data, ignoring...');
        }
    }

    _onIdentityMessage(socket, message) {
        if (_has(this._sockets, message.nodeName)) {
            debug('duplicate node name: %s', message.nodeName);
            this._writeToSocket(socket, new Message(ACK, [message.id, ['duplicate-node']]));
        } else {
            socket.nodeName = message.nodeName;
            this._sockets[message.nodeName] = socket;
            socket.on('close', this._cleanUpSocketConnection.bind(this, socket));
            debug('sending ACK (id: %s)', message.id);
            this._sendToNode(message.nodeName, new Message(ACK, [message.id, [null]]));
        }
    }

    _onShoutMessage(socket, message) {
        var msg = new Message(SHOUT, message.data);
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
        this._sendToNode(to, new Message(ACK, [cbid, params]));
    }

    _onTellMessage(socket, message) {
        var nodeName = message.data[0];
        var nodeEvent = message.data[1];
        var params = message.data[2];
        if (!_has(this._sockets, nodeName)) {
            debug('attempting to tell a non-existent node: %s', nodeName);
            this._sendToNode(message.nodeName, new Message(ACK, [message.id, ['unknown-node']]));
        } else {
            this._sendToNode(nodeName, new Message(TELL, [message.nodeName, message.id, nodeEvent, params]));
        }
    }

    _onLeaveMessage(socket, message) {
        this._writeToSocket(socket, new Message(ACK, [message.id, []]));
        this._cleanUpSocketConnection(socket);
    }

    _sendToNode(name, what) {
        if (_has(this._sockets, name)) {
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
            debug('Node "%s" has left. cleaning up...', name);
        }
        socket.removeAllListeners();
    }

    close(closeData) {
        var msg = new Message(CLOSE, _isArray(closeData) ? closeData : []);
        for (var nodeName in this._sockets) {
            this._sendToNode(nodeName, msg);
        }
        this._server.close();
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
