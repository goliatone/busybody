'use strict';
const net = require('net');
const Server = require('./server');
const Socket = require('./socket');
const ServerManager = require('./server/manager');
const SocketManager = require('./socket/manager');

module.exports.createServer = function(options, connectionListener) {
    //This should be a generic transport, at this point,
    //we don't know what protocol we want to use.
    return new Server(options, connectionListener);
};

/**
 * A factory function, which returns a new net.Socket
 * and automatically connects with the supplied options.
 *
 * `path` <string> Creates unix socket connection
 *                 to path. If this option is specified,
 *                 host and port are ignored.
 *
 * @return {Socket} [description]
 */
module.exports.connect = function(port, host, connectionListener) {
    //we can have the following:
    //options with or without callback
    //path with or without callback
    //port, with host or without, and with or without callback

    //normalize arguments

    //connect does not have a way to know if we want TLS or other
    //transport. We need to be explicit...
};

module.exports.createConnection = module.exports.connect;

/*
 * Expose net package methods.
 */
module.exports.isIP = net.isIP;
module.exports.isIPv4 = net.isIPv4;
module.exports.isIPv6 = net.isIPv6;

module.exports.Server = Server;

module.exports.ServerManager = ServerManager;

module.exports.Socket = Socket;

module.exports.SocketManager = SocketManager;
