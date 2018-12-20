'use strict';

const busybody = require('..');
const config = {
    path: '/tmp/kiko4.sock'
};
// bridges can be in any process, and nodes can be in any process
const bridge = busybody.createBridge(config);