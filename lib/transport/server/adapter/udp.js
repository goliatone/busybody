'use strict';

const UDPServer = require('dgram').Socket;

const DEFAULTS = {
    type: 'udp4'
};

class UDPAdapter extends UDPServer {

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

        console.log('options');

        super(options, connectionListener);
    }

    get protocol(){
        return 'udp';
    }
}

module.exports = UDPAdapter;
module.exports.protocol = 'udp';
