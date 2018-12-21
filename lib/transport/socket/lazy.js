'use strict';

//TODO: Implement using Proxy!
class LazySocket {

    constructor(options) {
        this.options = options;

        this._once = [];
        this._listeners = [];

        this._contexts = [];
        this._ticketKeys = [];
    }

    setupAdapter(SocketClass) {
        const socket = new SocketClass(this.options);

        this._listeners.map(e => {
            if (e.once) {
                socket.once(e.eventName, e.listener);
            } else {
                socket.on(e.eventName, e.listener);
            }
        });

        if (this._maxListeners) {
            socket.setMaxListeners(this._maxListeners);
        }

        return socket;
    }

    connect(port, host, connectListener) {
        this._connect = {
            port,
            host,
            connectListener
        };
    }

    destroy(exception) {
        this._destroy = exception;
    }

    end(data, encoding) {
        this._end = {
            data,
            encoding
        };
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._resumed = true;
    }

    setEncoding(encoding) {
        this._encoding = encoding;
    }

    setKeepAlive(enable, initialDelay) {
        this._keepAlive = {
            enable,
            initialDelay
        };
    }

    setNoDelay(noDelay) {
        this._noDelay = noDelay;
    }

    setTimeout(timeout, callback) {
        this._setTimeout = {
            timeout,
            callback
        };
    }

    write(data, encoding, callback) {
        if (!this._write) this._write = [];
        this._write.push({ data, encoding, callback });
    }

    address() {
        return null;
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

    get bufferSize() {
        return -1;
    }

    get bytesRead() {
        return -1;
    }

    get bytesWritten() {
        return -1;
    }

    get connecting() {
        return false;
    }

    get destroyed() {
        return false;
    }

    get localAddress() {
        return '';
    }

    get localPort() {
        return -1;
    }

    get remoteAddress() {
        return -1;
    }

    get remoteFamily() {
        return -1;
    }

    get remotePort() {
        return -1;
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

module.exports = LazySocket;