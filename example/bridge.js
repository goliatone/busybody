'use strict';

const busybody = require('..');

// bridges can be in any process, and nodes can be in any process
const bridge = busybody.createBridge();
