# busybody

Simple IPC library

This requires a bridge to connect all nodes. The bridge can reside in any process.

Client:Node
Server:Bridge

IPC Transports:
Unix Socket
TCP


Server should be able to connect on a stateless manner, we have a Unix socket path, and if the file is there, we move on. Else we make new connection.

http://xathrya.web.id/blog/2013/10/21/nodejs-unix-sockets/


http://stackoverflow.com/questions/16178239/gracefully-shutdown-unix-socket-server-on-nodejs-running-under-forever
>I suggest you clean up on start. When you get EADDRINUSE, try to connect to the socket. If the socket connection succeeds, another server is running and so this instance should exit. If the connection fails then it is safe to unlink the socket file and create a new one.

```js
var fs = require('fs');
var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
    console.log('server connected');
    c.on('end', function() {
        console.log('server disconnected');
    });
    c.write('hello\r\n');
    c.pipe(c);
});

server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
        var clientSocket = new net.Socket();
        clientSocket.on('error', function(e) { // handle error trying to talk to server
            if (e.code == 'ECONNREFUSED') {  // No other server listening
                fs.unlinkSync('/tmp/app-monitor.sock');
                server.listen('/tmp/app-monitor.sock', function() { //'listening' listener
                    console.log('server recovered');
                });
            }
        });
        clientSocket.connect({path: '/tmp/app-monitor.sock'}, function() {
            console.log('Server running, giving up...');
            process.exit();
        });
    }
});

server.listen('/tmp/app-monitor.sock', function() { //'listening' listener
    console.log('server bound');
});
```

https://www.npmjs.com/package/nats
https://www.npmjs.com/package/discover-tcp-transport

## Getting Started
Install the module with: `npm install busybody`

```javascript
var busybody = require('busybody');
busybody.awesome(); // "awesome"
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2015 goliatone  
Licensed under the MIT license.
