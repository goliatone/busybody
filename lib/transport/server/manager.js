'use strict';
const EventEmitter = require('events');

const TCPAdapter = require('../server/adapter/tcp');
const TLSAdapter = require('../server/adapter/tls');
const UDPAdapter = require('../server/adapter/udp');

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
class ServerManager extends EventEmitter {
    constructor(config) {
        super();
        this.init(config);
    }

    init(config) {
        this._adapters = new Map();

        for (var [protocol, adapter] of _adapters) {
            this.addAdapter(protocol, adapter);
        }
    }

    addAdapter(protocol, adapter) {
        if (this._adapters.has(protocol)) {
            return this;
        }

        this._adapters.set(protocol, adapter);
        return this;
    }

    getAdapter(protocol) {
        return this._adapters.get(protocol);
    }

    getAdapterFromOptions(options) {
        return undefined;
    }

    getAdapterFromArgs(...args) {
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
    findByUri(uri = '') {
        let protocol;
        /*
         * do we have an explicit transport
         * in the uri scheme?
         */
        let match = uri.match(/^([a-z]+):\/\//);
        if (match && match[1]) {
            protocol = match[1];
            return this.findByProtocol(protocol);
        }
    }

    findByProtocol(protocol) {
        return this._adapters.get(protocol);
    }
}

module.exports = ServerManager;

function addAdapter(protocol, adapter) {
    _adapters.set(protocol, adapter);
}

addAdapter('tcp', TCPAdapter);
addAdapter('tls', TLSAdapter);
addAdapter('udp', UDPAdapter);

module.exports.addAdapter = addAdapter;

if (require.main === module) {
    let transport = new ServerManager();
    console.log(transport.findByUri('tcp://localhost:22332').protocol);
    console.log(transport.findByUri('tls://localhost:22332').protocol);
    console.log(transport.findByUri('udp:///0.0.0.0:55555').protocol);
}