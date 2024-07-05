// import * as net from "net";

// const connection = net.createConnection(9999, '127.0.0.1', () => {
//     let msg : string = "1";
//     let sendBuffer : Buffer = Buffer.alloc(4 + msg.length); //4B for length field
//     sendBuffer.writeInt32BE(msg.length, 0);
//     sendBuffer.write(msg , 4); //write data after length field
//     setTimeout(()=>send(sendBuffer), 1000);
// });

// var send = (sendBuffer : Buffer) => {
//     connection.write(sendBuffer, () => {console.log("sended")});
//     //setTimeout(()=>send(sendBuffer), 1000);
// }

import * as dgram from 'dgram';
const server = dgram.createSocket('udp4');
    
const PORT = 9987;
server.bind(PORT, '0.0.0.0');

setInterval(() => {
    let msg : string = "12231224";
    let sendBuffer : Buffer = Buffer.alloc(4 + msg.length); //4B for length field
    sendBuffer.writeInt32BE(msg.length, 0);
    sendBuffer.write(msg , 4); //write data after length field
    server.send(sendBuffer, 0, sendBuffer.length, 9999, '127.0.0.1', () => {
        console.log('sendBufferSize: ' + sendBuffer.length);
    });
}, 1000);