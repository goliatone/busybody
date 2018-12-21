'use strict';
const net = require('net');
const Server = require('./server');
const Socket = require('./socket');
const ServerManager = require('./server/manager');
const SocketManager = require('./socket/manager');

/**
 * 
 * @param {Object} options Options
 * @param {Boolean} [options.allowHalfOpen=false]  Indicates whether half-opened TCP 
 *                                                 connections are allowed.
 * @param {Boolean} [options.pauseOnConnect=false]  Indicates whether the socket should 
 *                                                  be paused on incoming connections
 * @param {Function} connectionListener   Automatically set as a listener for the 'connection' event.
 */
module.exports.createServer = function(options, connectionListener) {
    //This should be a generic transport, at this point,
    //we don't know what protocol we want to use.
    return new Server(options, connectionListener);
};

/**
 * A factory function, which returns a new net.Socket
 * and automatically connects with the supplied options.
 *
 * @param {String} path Creates unix socket connection
 *                      to path. If this option is specified,
 *                      host and port are ignored.
 *
 * @return {Socket} 
 */
module.exports.createConnection = function(port, host, connectionListener) {
    const socket = new Socket();

    const args = [].slice.call(arguments);
    socket.connect.apply(socket, args);

    return socket;
};

module.exports.connect = module.exports.createConnection;

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