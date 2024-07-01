import * as dgram from "dgram";

const server = dgram.createSocket('udp4');

server.on('listening', () => {
    setTimeout(() => {server.send("hello", 0, "hello".length, 9999, "13.228.225.19");});
});

server.bind(9999);