'use strict';

const busybody = require('..');

const config = {
    id: 'node1',
    path: '/tmp/kiko4.sock'
};

const node = busybody.createNode(config, function(err) {
    if (err) {
        return onError(err);
    }
    // successfully connected to bridge
    console.log('node online!');
});

node.on('event', function(message, res) {
    // do awesomeness
    console.log(typeof message, message);

    // send a callback fig.1
    res(null, 'ilovenodejs');
});

node.on('ping', (message, res) => {
    console.log('on ping', message);
    res(null, 'pong');
});

node.on('shout_eve', (message, res) => {
    console.log('On shout event', message);
});

function onError(e) {
    console.error(e);
}