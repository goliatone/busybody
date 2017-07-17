'use strict';

const Socket = require('tls').TLSSocket;

class SocketAdapter extends Socket {
    constructor(options, connectionListener) {
        super(options, connectionListener);
    }

    get protocol(){
        return 'tls';
    }
}

module.exports = SocketAdapter;
module.exports.protocol = 'tls';
