'use strict';
const busybody = require('..');

const config = {
    path: '/tmp/kiko4.sock'
};
const anon = busybody.createNode(config, function (err) {
    if (err) {
        return onError(err);
    }
    console.log('somenode online!');
});

anon.tell('node1:event', {msg:'busybody_is_easy'}, function (err, message) {
    if (err) {
        return onError(err);
    }
    console.log(message); // -> 'ilovenodejs'
});

anon.tell('node1:ping', new Date(), (err, message)=>{
    if (err) {
        return onError(err);
    }
    console.log(message);
});

anon.on('shout_eve', (message, res) => {
    console.log('On shout event', message);
});

function onError(e) {
    console.error(e);
}
