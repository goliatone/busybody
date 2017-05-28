'use strict'

const uuid = require('uuid');
const enums = require('./constants');

class Message {
    constructor(method, data) {
        this.id = uuid.v4();
        this.method = method;
        this.data = Array.isArray(data) ? data : [];

        return this;
    }

    getId() {
        return this.id;
    }

    setNodeName(nodeName) {
        this.nodeName = nodeName;
    }

    fromString(str) {
        let message;

        try {
            message = JSON.parse(str);
        } catch(e) {
            if(str === enums.PING) {
                message = {method: enums.PING, data: []};
            } else return;
        }

        if(message.id) {
            this.id = message.id;
        }

        this.data = message.data;
        this.method = message.method;

        if(message.nodeName) {
            this.nodeName = message.nodeName;
        }

        return this;
    }

    toString() {
        var out = {
            id: this.id,
            method: this.method,
            data: this.data
        };

        if (this.nodeName) {
            out.nodeName = this.nodeName;
        }

        return JSON.stringify(out) + enums.EOL;
    }
}


module.exports = Message;

module.exports.fromString = function(event) {
    return new Message().fromString(event);
};
