'use strict';

const Socket = require('net').Socket;

class SocketAdapter extends Socket {
    constructor(options, connectionListener) {
        super(options, connectionListener);
    }

    get protocol(){
        return 'tcp';
    }
}

module.exports = SocketAdapter;
module.exports.protocol = 'tcp';
