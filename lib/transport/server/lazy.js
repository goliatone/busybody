'use strict';

//@TODO: Make LazyProxy using ES6 Proxy.
//https://github.com/fundon/delegate-proxy/blob/master/index.js
//https://github.com/mikaelbr/proxy-fun/tree/master/examples/generate-api

/**
 * Lazy server instance.
 * @type {LazyServer}
 */
class LazyServer {
    constructor(options, connectionListener) {

        if (typeof options === 'function') {
            connectionListener = options;
            options = {};
        }

        this.options = options;
        this.connectionListener = connectionListener;

        this._once = [];
        this._listeners = [];

        this._contexts = [];
        this._ticketKeys = [];
    }

    setupAdapter(TransportClass) {
        let tx = new TransportClass(this.options, this.connectionListener);

        this._listeners.map(e => {
            if (e.once) {
                tx.once(e.eventName, e.listener);
            } else {
                tx.on(e.eventName, e.listener);
            }
        });

        if (this._ref) {
            tx.ref();
        }

        if (this._unref) {
            tx.unref();
        }

        if (this._maxListeners) {
            tx.setMaxListeners(this._maxListeners);
        }

        this._contexts.map(c => {
            tx.addContext(c.hostname, c.context);
        });

        this._ticketKeys.map(b => {
            tx.setTicketKeys(b);
        });

        return tx;
    }

    listen(port, hostname, backlog, callback) {
        //this is for completness but should not be called
        throw new Error('Not implemted');
    }

    close(callback) {
        //this is for completness but should not be called
        throw new Error('Not implemted');
    }

    ref() {
        //this is for completness but should not be called
        this._ref = true;
        this._unref = false;
        return this;
    }

    unref() {
        //this is for completness but should not be called
        this._ref = false;
        this._unref = true;
        return this;
    }

    address() {
        return null;
    }

    getConnections(cb) {
        cb(null, 0);
    }

    get listening() {
        return false;
    }

    get connections() {
        return 0;
    }

    get maxConnections() {
        return undefined;
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
        this._contexts.push({ hostname, context });
    }

    /**
     * Returns a Buffer instance holding
     * the keys currently used for encryption/decryption
     * of the TLS Session Tickets.
     * @TODO: Implement!
     *
     * @return {Buffer}
     */
    getTicketKeys() {
        throw new Error('Not implemted');
        return this._ticketKeys.concat();
    }

    /**
     * Updates the keys for encryption/decryption of
     * the TLS Session Tickets.
     *
     * @param {Buffer} keys The keys used for encryption/decryption
     *                      of the TLS Session Tickets.
     */
    setTicketKeys(keys) {
        return this._ticketKeys.push(keys);
    }

    ///////////////////////////////////////////
    // EventEmitter
    ///////////////////////////////////////////

    addListener(eventName, listener) {
        this._listeners.push({ eventName, listener });
        return this;
    }

    on(eventName, listener) {
        this._listeners.push({ eventName, listener });
        return this;
    }

    once(eventName, listener) {
        this._listeners.push({ eventName, listener, once: true });
        return this;
    }

    emit(eventName, ...args) {
        // Returns true if the event had listeners, false otherwise.
        throw new Error('Not implemted');
    }

    eventNames() {
        // Returns an array listing the events for which the emitter has registered listeners. The values in the array will be strings or Symbols.
        throw new Error('Not implemted');
    }

    getMaxListeners() {
        // Returns the current max listener value for the EventEmitter which is either set by emitter.setMaxListeners(n) or defaults to EventEmitter.defaultMaxListeners.
        throw new Error('Not implemted');
    }

    listenerCount(eventName) {
        // Returns the number of listeners listening to the event named eventName.
        throw new Error('Not implemted');
    }

    listeners(eventName) {
        // Returns a copy of the array of listeners for the event named eventName.
        throw new Error('Not implemted');
    }

    prependListener(eventName, listener) {
        throw new Error('Not implemted');
        return this;
    }

    prependOnceListener(eventName, listener) {
        throw new Error('Not implemted');
        return this;
    }

    removeAllListeners(eventName) {
        throw new Error('Not implemted');
        return this;
    }

    removeListener(eventName, listener) {
        throw new Error('Not implemted');
        return this;
    }

    setMaxListeners(n) {
        this._maxListeners = n;
        return this;
    }
}

module.exports = LazyServer;