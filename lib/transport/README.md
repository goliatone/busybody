## Architecture

- Transport: A wrapper class that exposes the same API as the net Server and manages to select the actual transport implementation. On construction and until we can figure out the actual transport, we have a LazyTransport instance.



Adapters:
tcp
tls
usd
udp

nats
amqp
mqtt

ws
wss
