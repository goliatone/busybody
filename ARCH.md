## Transports

* TCP: Transmission Control Protocol
* UDS: Unix Domain Socket
* TLS: Transport Layer Security
* UDP:
## TCP
The net module provides you with an asynchronous network wrapper. It contains functions for creating both servers and clients (called streams).

Uses the `net` package.

## SOC

## TLS
Transport Layer Security (TLS) and Secure Socket Layer (SSL) protocols that is built on top of OpenSSL.
The TLS/SSL is a public/private key infrastructure (PKI). For most common cases, each client and server must have a private key.

Uses the `tls` package.

```
server.listen(port[, hostname][, callback])
```




## UDP

>UDP protocol is bidirectional, then actually there is no strict difference between client and server. So your server and client code will be almost the same, the difference is that actually one will send packets and other will only respond. Also note that you have an infinite loop, because your probably using .send with PORT and HOST variables and you have to send to different host/port pair.

```js
var host = '127.0.0.1', port = 33333;

var dgram = require('dgram');

var server = dgram.createSocket('udp4');

server.on( 'message', function( msg, rinfo ) {
    console.log( rinfo.address + ':' + rinfo.port + ' - ' + msg );
    server.send( msg, 0, msg.length, rinfo.port, rinfo.address ); // added missing bracket
});
server.bind( port, host );
```

```js
// NOTE: the port is different
var host = '127.0.0.1', port = 33334;

var dgram = require( 'dgram' );

var client = dgram.createSocket( 'udp4' );

client.on( 'message', function( msg, rinfo ) {
    console.log( 'The packet came back' );
});

// client listens on a port as well in order to receive ping
client.bind( port, host );

// proper message sending
// NOTE: the host/port pair points at server
var message = new Buffer( 'My KungFu is Good!' );
client.send(message, 0, message.length, 33333, '127.0.0.1' );
```

https://www.npmjs.com/package/utp
https://github.com/tj/punt
https://github.com/tj/axon
