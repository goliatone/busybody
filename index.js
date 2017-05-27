'use strict';

const util = require('util');

const Node = exports.Node = require('./lib/node');

exports.createNode = function (a, b, c) {

    return new Node(a, b, c);
};

const Bridge = exports.Bridge = require('./lib/bridge');

exports.createBridge = function (a, b) {
    return new Bridge(a, b);
};

exports.Node = Node;
exports.Bridge = Bridge;
