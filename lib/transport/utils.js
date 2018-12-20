'use strict';
const URL = require('url');

//get net transport from options




/**
 * nats://foo:bar@localhost:4222?action=publish&data=[uuid]#node:event
 *
 * @param  {String}  uri
 * @param  {Boolean} [parseQueryString=true]
 * @return {Object}
 */
function getConfigFromUri(uri, parseQueryString = true) {
    let url = URL.parse(uri, parseQueryString);
    let config = {};
    config.protocol = strip(url.protocol, ':');

    if (url.auth) {
        config.username = url.auth.split(':')[0];
        config.password = url.auth.split(':')[1];
    }

    if (url.hostname) {
        config.host = url.hostname;
    }

    if (url.port) {
        config.port = parseInt(url.port);
    }

    if (url.query) {
        config.data = url.query;
    }

    if (url.pathname) {
        config.path = url.pathname;
    }

    if (url.hash) {
        config.metadata = strip(url.hash, '#');
    }

    return config;
}

function strip(str = '', c = '') {
    return str.replace(c, '');
}

module.exports.getConfigFromUri = getConfigFromUri;

console.log(getConfigFromUri('nats://foo:bar@localhost:4222?action=publish&data=[uuid]#node:event'));