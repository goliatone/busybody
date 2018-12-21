'use strict';

const LazySocket = require('./lazy');
const Manager = require('./manager');
const debug = require('debug')('transport:socket');

class TransportSocket {

    constructor(options) {
        this._socket = new LazySocket(options);
    }

    connect(port, host, connectListener) {
        const args = [].slice.call(arguments);
        const options = this._socket.options;

        const manager = new Manager(this);

        let Adapter = manager.getAdapterFromOptions(options);

        if (!Adapter) {
            Adapter = manager.getAdapterFromArgs(args);
        }

        if (!Adapter) {
            //@TODO: Remove :) just for testing
            debug('WARN: we are generating our transport by hand! FIX');
            Adapter = manager.getAdapter('tcp');
        }

        if (!Adapter) {
            throw new Error('Unable to find a valid transport');
        }

        const socket = this._socket.setupAdapter(Adapter);
        this._socket = socket;

        return this._socket.connect.apply(socket, args);
    }

    destroy(exception) {
        this._socket.destroy(exception);
    }

    end(data, encoding) {
        this._socket.end(data, encoding);
    }

    pause() {
        this._socket.pause();
    }

    resume() {
        this._socket.resume();
    }

    setEncoding(encoding) {
        this._socket.setEncoding(encoding);
    }

    setKeepAlive(enable, initialDelay) {
        this._socket.setKeepAlive(enable, initialDelay);
    }

    setNoDelay(noDelay) {
        this._socket.setNoDelay(noDelay);
    }

    setTimeout(timeout, callback) {
        this._socket.setTimeout(timeout, callback);
    }

    write(data, encoding, callback) {
        this._socket.write(data, encoding, callback);
    }

    address() {
        return this._socket.address;
    }

    ref() {
        //this is for completness but should not be called
        this._socket.ref();
        return this;
    }

    unref() {
        //this is for completness but should not be called
        this._socket.unref();
        return this;
    }

    get bufferSize() {
        return this._socket.bufferSize;
    }

    get bytesRead() {
        return this._socket.bytesRead;
    }

    get bytesWritten() {
        return this._socket.bytesWritten;
    }

    get connecting() {
        return this._socket.connecting;
    }

    get destroyed() {
        return this._socket.destroyed;
    }

    get localAddress() {
        return this._socket.localAddress;
    }

    get localPort() {
        return this._socket.localPort;
    }

    get remoteAddress() {
        return this._socket.remoteAddress;
    }

    get remoteFamily() {
        return this._socket.remoteFamily;
    }

    get remotePort() {
        return this._socket.remotePort;
    }

    ///////////////////////////////////////////
    // EventEmitter
    ///////////////////////////////////////////

    addListener(eventName, listener) {
        this._socket.addListener(eventName, listener);
        return this;
    }

    on(eventName, listener) {
        this._socket.on(eventName, listener);
        return this;
    }

    once(eventName, listener) {
        this._socket.once(eventName, listener);
        return this;
    }

    emit(eventName, ...args) {
        // Returns true if the event had listeners, false otherwise.
        this._socket.emit(eventName, ...args);
    }

    eventNames() {
        // Returns an array listing the events for which the emitter has registered listeners. The values in the array will be strings or Symbols.
        return this._socket.eventNames();
    }

    getMaxListeners() {
        // Returns the current max listener value for the EventEmitter which is either set by emitter.setMaxListeners(n) or defaults to EventEmitter.defaultMaxListeners.
        return this._socket.getMaxListeners();
    }

    listenerCount(eventName) {
        // Returns the number of listeners listening to the event named eventName.
        return this._socket.listenerCount(eventName);
    }

    listeners(eventName) {
        // Returns a copy of the array of listeners for the event named eventName.
        this._socket.listeners(eventName);
        return this;
    }

    prependListener(eventName, listener) {
        this._socket.prependListener(eventName, listener);
        return this;
    }

    prependOnceListener(eventName, listener) {
        this._socket.prependOnceListener(eventName, listener);
        return this;
    }

    removeAllListeners(eventName) {
        this._socket.removeAllListeners(eventName);
        return this;
    }

    removeListener(eventName, listener) {
        this._socket.removeListener(eventName, listener);
        return this;
    }

    setMaxListeners(n) {
        this._socket.setMaxListeners(n);
        return this;
    }
}

module.exports = TransportSocket;