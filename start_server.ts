import Room from "./src/room";
import Player from "./src/player";
import * as dgram from "dgram";
import {v4} from 'uuid';
import { SendRoomsInfoToClient, GetPlayerByID, GetRoomById } from "./src/function";

var onlinePlayers : Player[] = [];
var Rooms : Room[] = [];


const server = dgram.createSocket('udp4');


//Handle request from clients
server.on('message', (data: Buffer, rInfo : dgram.RemoteInfo) => {
        //parse data
        const receivedData = data.toString('utf-8');
        console.log(`Received from client (${rInfo.address}:${rInfo.port}): ${receivedData}`);
        let json : any = JSON.parse(receivedData);

        //process event
        switch(json._event.event_name)
        {
            case 'first connect':
                console.log(`Client: (${rInfo.address}:${rInfo.port}) connected`);

                //player first connect => provide a specific id and add to online players
                let playerID : string = v4();
                let thisPlayer : Player = new Player(playerID, rInfo.address, rInfo.port, "quoc");
                onlinePlayers.push(thisPlayer);
                let d = {
                    event_name : "provide id",
                    id : playerID,
                    player_name : thisPlayer.name
                }
                
                server.send(JSON.stringify(d), 0, JSON.stringify(d).length, rInfo.port, rInfo.address);
                break;
            //create room
            case 'create_rooms':
                let player : Player = GetPlayerByID(json.player_id, onlinePlayers);
                Rooms.splice(0, 0, new Room(player, json._event.name, json._event.game_mode));
                break;
            //get available room
            case 'get_rooms':
                SendRoomsInfoToClient(server, Rooms, rInfo.address, rInfo.port);
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
                server.send(JSON.stringify(data), 0, JSON.stringify(data).length, rInfo.port, rInfo.address);
                
                let join_player = GetPlayerByID(json.player_id, onlinePlayers);
                let data1 = {
                    event_name : "new player join",
                    player_id : join_player.id,
                    player_name : join_player.name
                }
                server.send(JSON.stringify(data1), 0, JSON.stringify(data1).length, host_player.port, host_player.address);

                break;
        };
    });

//start server
const PORT = 9999;
server.on('listening', () => {
    const address = server.address();
    console.log(`Server listening on ${address.address}:${address.port}`);
});

server.bind(PORT, '0.0.0.0');

//support functions
var RemoveRoom = (room_id : string) => {
    let room_index : number = Rooms.findIndex((room) => room.id == room_id);
    if(room_index > -1) Rooms.splice(room_index, 1);
}

export default RemoveRoom;