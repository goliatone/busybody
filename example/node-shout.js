'use strict';

const busybody = require('..');

const config = {
    id: 'node2',
    path: '/tmp/kiko4.sock'
};

const node = busybody.createNode(config, function(err) {
    if (err) {
        return onError(err);
    }
    // successfully connected to bridge
    console.log('node online!');
    node.broadcast('broadcast_eve', 'my message');
});

node.on('event', function(message, res) {
    // do awesomeness
    console.log(message);

    // send a callback fig.1
    res(null, 'this is node broadcast!');
});

function onError(e) {
    console.error(e);
}