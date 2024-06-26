import Room from "./src/room";
import Player from "./src/player";
import * as dgram from "dgram";
import {v4} from 'uuid';
import { SendRoomsInfoToClient } from "./src/function";

var onlinePlayers : Map<string, Player> = new Map<string, Player>();
var Rooms : Map<string, Room> = new Map<string, Room>();


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
                onlinePlayers.set(playerID, thisPlayer);
                let d = {
                    event_name : "provide id",
                    id : playerID,
                    player_name : thisPlayer.name
                }
                
                server.send(JSON.stringify(d), 0, JSON.stringify(d).length, rInfo.port, rInfo.address);
                break;
            //create room
            case 'create_rooms':
                let player : Player | undefined = onlinePlayers.get(json.player_id);
                if(player) Rooms.set(player.id, new Room(player, json._event.name, json._event.game_mode, server));
                break;
            //get available room
            case 'get_rooms':
                SendRoomsInfoToClient(server, Rooms, rInfo.address, rInfo.port);
                break;
            //join room
            case 'join_room':
                //send host info to join player
                let room : Room | undefined  = Rooms.get(json._event.room_id);
                let host_player : Player | undefined  = room ? onlinePlayers.get(room.id) : undefined;
                let data = {
                    event_name : "joined",
                    player_id : host_player?.id,
                    player_name : host_player?.name
                }
                server.send(JSON.stringify(data), 0, JSON.stringify(data).length, rInfo.port, rInfo.address);
                
                //send join player info to host
                let join_player : Player | undefined = onlinePlayers.get(json.player_id);
                let data1 = {
                    event_name : "new player join",
                    player_id : join_player?.id,
                    player_name : join_player?.name
                }
                if(host_player) server.send(JSON.stringify(data1), 0, JSON.stringify(data1).length, host_player.port, host_player.address);
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
// server.setSendBufferSize(64 * 1024);


//support functions
var RemoveRoom = (room_id : string) => {
    Rooms.delete(room_id);
}

export default RemoveRoom;