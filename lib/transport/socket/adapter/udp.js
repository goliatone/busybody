'use strict';

const Socket = require('dgram').Socket;

const DEFAULTS = {
    type: 'udp4'
};

class SocketAdapter extends Socket {

    constructor(options, connectionListener) {

        if (options !== null && typeof options === 'string') {
            options = {type: options};
        }

        if(typeof options === 'function') {
            connectionListener = options;
            options = DEFAULTS;
        }

        if(!options) {
            //udp4, udp6
            options = DEFAULTS;
        }

        super(options, connectionListener);
    }

    get protocol(){
        return 'udp';
    }
}

module.exports = SocketAdapter;
module.exports.protocol = 'udp';
