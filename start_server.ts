import Room from "./src/room";
import Player from "./src/player";
import * as net from "net";
import {v4} from 'uuid';
import { SendRoomsInfoToClient, GetPlayerByID, GetRoomById } from "./src/function";

var onlinePlayers : Player[] = [];
var Rooms : Room[] = [];


const server = net.createServer((socket: net.Socket) => {
    console.log(`Client: (${socket.remoteAddress}:${socket.remotePort}) connected`);

    //player first connect => provide a specific id and add to online players
    let playerID : string = v4();
    let data = {
        event_name : "provide id",
        id : playerID
    }
    socket.write(JSON.stringify(data));
    onlinePlayers.push(new Player(socket, playerID));

    // Handle request from clients
    socket.on('data', (data: Buffer) => {
        //parse data
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);
        console.log(`Received from client (${socket.remoteAddress}:${socket.remotePort}): ${receivedData}`);

        //process event
        switch(json._event.event_name)
        {
            //create room
            case 'create_rooms':
                let player : Player = GetPlayerByID(playerID, onlinePlayers);
                Rooms.splice(0, 0, new Room(player, json._event.name, json._event.game_mode));
                break;
            //get available room
            case 'get_rooms':
                SendRoomsInfoToClient(socket, Rooms);
                break;
            //join room
            case 'join_room':
                let room : Room  = GetRoomById(json._event.room_id, Rooms);
                let host_player : Player  = GetPlayerByID(room.id, onlinePlayers);
                let data = {
                    event_name : "joined",
                    player_id : host_player.id,
                    player_name : host_player.name
                }
                socket.write(JSON.stringify(data));
                
                let join_player = GetPlayerByID(playerID, onlinePlayers);
                let data1 = {
                    event_name : "new player join",
                    player_id : playerID,
                    player_name : join_player.name
                }
                join_player.socket.write(JSON.stringify(data1));
                
                break;
        };
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

//start server
const PORT = 9999;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on all interfaces at port ${PORT}`);
});

//support functions
var RemoveRoom = (room_id : string) => {
    let room_index : number = Rooms.findIndex((room) => room.id == room_id);
    if(room_index > -1) Rooms.splice(room_index, 1);
}

export default RemoveRoom;