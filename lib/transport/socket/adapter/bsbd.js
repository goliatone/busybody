'use strict';

const EventEmitter = require('events');

class LocalAdapter extends EventEmitter {
    constructor(options, connectionListener) {
        super();

        if (connectionListener) {
            this.on('connect', connectionListener);
        }
    }

    connect() {
        setTimeout(_ => {
            this.emit('connect');
        }, 100);
    }

    setTimeout() {}
    setEncoding() {}

    write(msg) {
        console.log('++++++++++++');
        console.log('Here we should do something!');
        console.log(msg);
        console.log('++++++++++++');
        this.emit('data', msg);
    }

    end() {}

    get protocol() {
        return 'bsbd';
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
}

module.exports = LocalAdapter;
module.exports.protocol = 'bsbd';