'use strict';
const EventEmitter = require('events');

const TCPAdapter = require('../socket/adapter/tcp');
const TLSAdapter = require('../socket/adapter/tls');
const UDPAdapter = require('../socket/adapter/udp');

let _adapters = new Map();

/**
 * Generic transport class. It provides the
 * same API as the net package.
 *
 * @event: 'close'
 * @event: 'connection'
 * @event: 'error'
 * @event: 'listening'
 *
 */
class SocketManager extends EventEmitter {

    constructor(config) {
        super();
        this.init(config);
    }

    init(config) {
        this._adapters = new Map();

        for (var [protocol, adapter] of _adapters) {
            this.addTransportAdapter(protocol, adapter);
        }
    }

    addTransportAdapter(protocol, adapter) {
        this._adapters.set(protocol, adapter);
        return this;
    }

    getTransportAdapter(protocol) {
        return this._adapters.get(protocol);
    }

    getTransportFromOptions(options) {
        return undefined;
    }

    getTransportFromListenArgs(...args) {
        return undefined;
    }

    /**
     * Finds a transport by a given `uri`.
     * `uri`s are in the form:
     * <protocol>://<connection:details>
     *
     * Examples would be:
     * - tcp://localhost:8000
     * - tls://localhost:4000
     * - usp:///tmp/core.sock
     * - udp://127.0.0.1:33334
     *
     * We can add custom transport layers:
     * - nats://localhost:4222
     *
     * Naive, very...
     *
     * @param  {String} uri
     * @return {Adapter}
     */
    findByUri(uri='') {
        let protocol;
        /*
         * do we have an explicit transport
         * in the uri scheme?
         */
        let match = uri.match(/^([a-z]+):\/\//);
        if(match && match[1]) {
            protocol = match[1];
            return this.findByProtocol(protocol);
        }
    }

    findByProtocol(protocol) {
        return this._adapters.get(protocol);
    }
}

module.exports = SocketManager;

function addTransportAdapter(protocol, adapter) {
    _adapters.set(protocol, adapter);
}

addTransportAdapter('tcp', TCPAdapter);
addTransportAdapter('tls', TLSAdapter);
addTransportAdapter('udp', UDPAdapter);

module.exports.addTransportAdapter = addTransportAdapter;
