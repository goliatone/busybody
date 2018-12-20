'use strict';
const busybody = require('..');
const repl = require('repl');

const config = {
    path: '/tmp/kiko4.sock'
};
const anon = busybody.createNode(config, function(err) {
    if (err) {
        return onError(err);
    }
    console.log('somenode online!');
});

//'node1:event' "{ msg: 'busybody_is_easy' }"
anon.tell('node1:event', { msg: 'busybody_is_easy' }, function(err, message) {
    if (err) {
        return onError(err);
    }
    console.log('node1:event response message:', message); // -> 'ilovenodejs'
});

anon.tell('node1:ping', new Date(), (err, message) => {
    if (err) {
        return onError(err);
    }
    console.log('tell node1:ping response message:', message);
});

anon.on('shout_eve', (message, res) => {
    console.log('On shout event:', message);
    console.log('response:', res);
});

function onError(e) {
    console.error(e);
}


const inter = repl.start({ prompt: '> ' });
initializeContext();

inter.on('reset', initializeContext);

function initializeContext() {
    inter.context.node = anon;
}