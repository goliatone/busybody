'use strict';

let callbacks = new Set();
let executed = false;
let timeout = 1000;
const debug = require('debug')('busy:exit');

//signals
//http://man7.org/linux/man-pages/man7/signal.7.html
//https://people.cs.pitt.edu/~alanjawi/cs449/code/shell/UnixSignals.htm
// https://www.npmjs.com/package/express-graceful-exit

const singals = [{
        signal: 'SIGHUP',
        label: 'Hangup',
        description: 'Hangup detected on controlling terminal or death of controlling process',
        code: 1,
        exit: true
    }, {
        signal: 'SIGINT',
        label: 'Interrupt',
        description: 'Interrupt from keyboard',
        code: 2,
        exit: true
    },
    {
        signal: 'SIGQUIT',
        description: 'Quit from keyboard',
        label: 'Quit',
        code: 3,
        exit: true
    }, {
        singal: 'SIGABRT',
        description: 'Abort signal from abort(3)',
        label: 'Abort',
        code: 6,
        exit: true
    }, {
        singal: 'SIGTERM',
        label: 'Terminated',
        description: 'Termination signal',
        code: 15,
        exit: true
    }
];

function doExit(exit, signal) {

    debug('handle exit request: %s', signal);

    if (executed) return;
    executed = true;

    const code = 128 + signal;

    for (const callback in callbacks) {
        callback(code);
    }

    if (exit === true) {
        setTimeout(_ => {
            debug('exiting now: code', code);
            process.exit(code);
        }, timeout);
    }
}


/**
 * timeout should be seconds.
 */
module.exports = function exitHandler(callback, secondsTimeout) {
    debug('adding callback');

    callbacks.add(callback);

    if (secondsTimeout) {
        //TODO: We should give it some limits  
        timeout = secondsTimeout * 1000;
    }

    if (callbacks.size === 1) {
        process.once('exit', doExit);

        singals.map(entry => {
            const { signal, exit, code } = entry;
            debug('register signal %s, exit: %s code: %s', signal, exit, code);
            process.once(signal, doExit.bind(null, exit, code));
        });

        /**
         * PM2 handler sends IPC message.
         */
        process.on('message', message => {
            if (message === 'shutdown') {
                doExit(true, -128);
            }
        });

        // process.on('uncaughtException', (err) => {
        // exit(true, -127);
        // });
    }
};