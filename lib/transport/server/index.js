'use strict';

const LazyServer = require('./lazy');
const Manager = require('./manager');

/**
 * Generic transport class. It provides the
 * same API as the net package.
 *
 * @event: 'close'
 * @event: 'connection'
 * @event: 'error'
 * @event: 'listening'
 *
 * server.address()
 * server.close([callback])
 * server.getConnections(callback)
 * server.listen(handle[, backlog][, callback])
 * server.listen(options[, callback])
 * server.listen(path[, backlog][, callback])
 * server.listen([port][, hostname][, backlog][, callback])
 * server.listening
 * server.maxConnections
 * server.ref()
 * server.unref()
 *
 * @TODO: Make LazyProxy using ES6 Proxy.
 * @link: https://github.com/fundon/delegate-proxy/blob/master/index.js
 * @link: https://github.com/mikaelbr/proxy-fun/tree/master/examples/generate-api
 * @link: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
 */
class TransportServer {
    constructor(options, connectionListener) {
        this._transport = new LazyServer(options, connectionListener);
    }

    listen(port, hostname, backlog, callback) {

        let args = [].slice.call(arguments);

        let options = this._transport.options;
        let listener = this._transport.connectionListener;

        let manager = new Manager(this);

        /*
         * If we got a type in constructor options or if
         * we got an uri we might be able to get the transport
         * without guessing.
         */
        let Adapter = manager.getTransportFromOptions(options);

        if(!Adapter) {
            Adapter = manager.getTransportFromListenArgs(args);
        }

        //@TODO: Remove :) just for testing
        Adapter = manager.getTransportAdapter('tcp');

        if(!Adapter) {
            throw new Error('Unable to find a valid transport');
        }

        let transport = this._transport.setupTransport(Adapter);

        this._transport = transport;

        return transport.listen.apply(transport, args);
    }

    ///////////////////////////////////////////
    // net.Server
    ///////////////////////////////////////////

    close(callback) {
        return this._transport.close(callback);
    }

    ref() {
        this._transport.ref();
        return this;
    }

    unref() {
        this._transport.unref();
        return this;
    }

    address() {
        return this._transport.address();
    }

    getConnections(cb) {
        return this._transport.getConnections(cb);
    }

    get listening() {
        return this._transport.listening;
    }

    get connections() {
        return this._transport.connections;
    }

    get maxConnections() {
        return this._transport.maxConnections;
    }

    ///////////////////////////////////////////
    // tls.Server
    ///////////////////////////////////////////

    /**
     * The server.addContext() method adds a secure context that
     * will be used if the client request's SNI hostname matches
     * the supplied hostname (or wildcard).
     *
     * @param {String} hostname A SNI hostname or wildcard
     *                          (e.g. '*')
     * @param {Object} context  An object containing any of
     *                          the possible properties from the
     *                          tls.createSecureContext() options
     *                          arguments (e.g. key, cert, ca, etc).
     */
    addContext(hostname, context) {
        return this._transport.addContext(hostname, context);
    }

    /**
     * Returns a Buffer instance holding the keys currently used for encryption/decryption of the TLS Session Tickets
     * @return {Buffer}
     */
    getTicketKeys() {
        return this._transport.getTicketKeys();
    }

    /**
     * Updates the keys for encryption/decryption of
     * the TLS Session Tickets.
     *
     * @param {Buffer} keys The keys used for encryption/decryption
     *                      of the TLS Session Tickets.
     */
    setTicketKeys(keys) {
        return this._transport.setTicketKeys(keys);
    }

    ///////////////////////////////////////////
    // EventEmitter
    ///////////////////////////////////////////

    addListener(eventName, listener) {
        return this._transport.addListener(eventName, listener);
    }

    on(eventName, listener) {
        return this._transport.on(eventName, listener);
    }

    once(eventName, listener) {
        return this._transport.once(eventName, listener);
    }

    emit(eventName, ...args) {
        return this._transport.emit.apply(this._transport, arguments);
    }

    eventNames() {
        return this._transport.eventNames();
    }

    getMaxListeners() {
        return this._transport.getMaxListeners();
    }

    listenerCount(eventName) {
        return this._transport.listenerCount(eventName);
    }

    listeners(eventName) {
        return this._transport.listeners(eventName);
    }

    prependListener(eventName, listener) {
        return this._transport.prependListener(eventName, listener);
    }

    prependOnceListener(eventName, listener) {
        return this._transport.prependOnceListener(eventName, listener);
    }

    removeAllListeners(eventName) {
        return this._transport.removeAllListeners(eventName);
    }

    removeListener(eventName, listener) {
        return this._transport.removeListener(eventName, listener);
    }

    setMaxListeners(n) {
        return this._transport.setMaxListeners(n);
    }
}

module.exports = TransportServer;
