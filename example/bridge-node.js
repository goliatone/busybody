'use strict';
const cleanup = require('../lib/cleanup');
const log = require('modlog')('bsbd:node');


class RpcMessageSolver {
    constructor(context) {
        this.context = context;
    }

    handler(payload) {
        const [method, args] = payload.data;
        const action = this.context[method];

        let event = {};

        if (args.length === 1 && typeof args[0] === 'object') {
            event = args[0];
            event.response = (resp) => {
                payload.response(payload.id, resp);
            };
        }

        if (typeof action === 'function') {
            let out = action(event);
        } else {
            payload.response('rpc.error', new Error('Invalid method'));
        }
    }
}

const busybody = require('..');
const config = {
    path: '/tmp/kiko4.sock'
};
// bridges can be in any process, and nodes can be in any process
const bridge = busybody.createBridge(config);

const app = {};
app.sayHi = function(event) {
    let resp = { text: 'Hello there!' };
    event.response(resp);
};

const rpcHandler = new RpcMessageSolver(app);


bridge.on('rpc', function(payload) {
    console.log('rpc...........');
    rpcHandler.handler(payload);
});

cleanup(code => {
    log.error('received %s signal, closing bridge...', code);
    bridge.close();
});