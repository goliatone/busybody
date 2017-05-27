'use strict'

const uuid = require('uuid');

function _isArray(a){
    return Array.isArray(a);
}

class Message {
    constructor(method, data) {
        this.id = uuid.v4();
        this.method = method;
        this.data = _isArray(data) ? data : [];

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

            return;
        }
        this.id = message.id;
        this.method = message.method;
        this.data = message.data;

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

        return JSON.stringify(out) + '\0';
    }
}

module.exports = Message
