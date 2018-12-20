'use strict';


class LazySocket {
    constructor(options) {
        this.options = options;

        this._once = [];
        this._listeners = [];

        this._contexts = [];
        this._ticketKeys = [];
    }

    connect(port, host, connectListener) {

    }

    destroy(exception) {

    }

    end(data, encoding) {

    }

    pause() {

    }

    resume() {

    }

    setEncoding(encoding) {

    }

    setKeepAlive(enable, initialDelay) {

    }

    setNoDelay(noDelay) {

    }

    setTimeout(timeout, callback) {

    }

    write(data, encoding, callback) {

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

    }

    get bytesRead() {

    }

    get bytesWritten() {

    }

    get connecting() {

    }

    get destroyed() {

    }

    get localAddress() {

    }

    get localPort() {

    }

    get remoteAddress() {

    }

    get remoteFamily() {

    }

    get remotePort() {

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