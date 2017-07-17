'use strict';

const TLSServer = require('tls').Server;

class TLSAdapter extends TLSServer {
    constructor(options, connectionListener) {
        super(options, connectionListener);
    }

    get protocol(){
        return 'tls';
    }
}

module.exports = TLSAdapter;
module.exports.protocol = 'tls';
