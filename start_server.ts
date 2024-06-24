import Room from "./src/room";
import Player from "./src/player";
import * as net from "net";
import {v4} from 'uuid';
import { Socket } from "socket.io";

var onlinePlayers : Player[] = [];
var Rooms : Room[];


const server = net.createServer((socket: net.Socket) => {
    console.log(`Client: (${socket.remoteAddress}:${socket.remotePort}) connected`);

    let playerID : string = v4();
    socket.write(`{id:${playerID}}`);
    onlinePlayers.push(new Player(socket, playerID));

    // Handle incoming data from clients
    socket.on('data', (data: Buffer) => {
        const receivedData = data.toString('utf-8');
        console.log(`Received from client (${socket.remoteAddress}:${socket.remotePort}): ${receivedData}`);

        // Echo back to client
        socket.write(`hello from server`);
    });

    // Handle client disconnection
    socket.on('end', () => {
        console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
    });

    // Handle errors
    socket.on('error', (err: Error) => {
        console.error(`Socket error: ${err.message}`);
    });
});

const PORT = 9999;
server.listen(PORT, '0.0.0.0', () => {
    console.log(server.address());
    console.log(`TCP server listening on port ${PORT}`);
});