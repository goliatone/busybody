'use strict';
const busybody = require('..');
const repl = require('repl');

const config = {
    id: 'rpc-client',
    path: '/tmp/kiko4.sock'
};
const anon = busybody.createNode(config, function(err) {
    if (err) {
        return onError(err);
    }
    console.log('somenode online!');
});

setTimeout(_ => {
    console.log('anon broadcast @event:');
    // anon.broadcast('broadcast_eve', { from: 'me' });

    //Try without callback;
    anon.rpc('sayHi', { from: 'me' }, function(topic, message) {
        console.log('rpc response', topic, message);
    });

}, 1000);


function onError(e) {
    console.error(e);
}

const inter = repl.start({ prompt: '> ' });
initializeContext();

inter.on('reset', initializeContext);

function initializeContext() {
    inter.context.node = anon;
}