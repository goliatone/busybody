'use strict';

const TCPServer = require('net').Server;

class TCPAdapter extends TCPServer {
    constructor(options, connectionListener) {
        super(options, connectionListener);
    }

    get protocol(){
        return 'tcp';
    }
}

module.exports = TCPAdapter;
module.exports.protocol = 'tcp';
