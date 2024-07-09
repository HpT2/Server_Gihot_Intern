import * as net from 'net'
import Room from "./src/room";
import Player from "./src/player";
import Creep from "./src/creep";
import {v4} from 'uuid';
const { Worker, isMainThread, parentPort } = require('worker_threads');

import { GetPlayersInfo, GetRoomsInfo } from "./src/function";

const maxDataLength : number = 4;

let onlinePlayers : Map<string, Player> = new Map<string, Player>();
let rooms : Map<string, Room> = new Map<string, Room>();

export function RemoveRoom(id : string)
{
    rooms.delete(id);
}

if (isMainThread) {
    
    const worker = new Worker(__filename);

    let bufferStream : Buffer = Buffer.from('');
    worker.on("message", (data : any) => {
        bufferStream = Buffer.concat([bufferStream, data]);
 
    })

    function waitForBuffer(size : number) {
        return new Promise(function(resolve, reject) {
            const checkBuffer = () => {
                if (bufferStream.length >= size) resolve(0);
                setTimeout(checkBuffer, 0);
            }
            checkBuffer();
        });
    }

    async function processBuffer()
    {
        await waitForBuffer(4);

        let length : number = parseInt(bufferStream.subarray(0, maxDataLength).toString("hex"), 16);
        await waitForBuffer(4 + length);
        let data : string = bufferStream.subarray(maxDataLength, maxDataLength + length).toString('utf-8');
        bufferStream = bufferStream.subarray(maxDataLength + length, bufferStream.length); 
        let json : any = JSON.parse(data);
        //console.log(json);
            //process event
        switch(json._event.event_name) 
            {
                case 'first connect':
                    //player first connect => provide a specific id and add to online players
                    let playerID : string = v4();
                    let thisPlayer : Player = new Player(playerID, json.sessionId, 1,json._event.name);
                    onlinePlayers.set(playerID, thisPlayer);
                    let d = {
                        event_name : "provide id", 
                        id : playerID,
                        player_name : thisPlayer.name,
                        gun_id : thisPlayer.gun_id
                    }

                    worker.postMessage({socketId : json.sessionId, data : d});
    
                    //Just test 
                    // Creep.getInstance().OnRoomCreateMock();
                    // Creep.getInstance().StartSpawnProcessMock(0, server, json.port, json.address);
    
                    break;
                //create room
                case 'create_rooms':
                    let player : Player | undefined = onlinePlayers.get(json.player_id);
                    if(player) {
                        rooms.set(player.id, new Room(player, json._event.name, json._event.game_mode));
                        rooms.get(player.id)?.readied_players.set(player.id, true);
                        player.in_room = true;
                    }
                    break;
                //get available room
                case 'get_rooms':
                    let roomsArr : Room[] | undefined = Array.from(rooms.values());
                    let roomsData =  {
                        event_name : 'rooms',
                        rooms : GetRoomsInfo(roomsArr)
                    }
                    worker.postMessage({socketId : json.sessionId, data :  roomsData});
                    break;
                //join room
                case 'join_room':
                    // //Get info
                    let room : Room | undefined  = rooms.get(json._event.room_id);
                    let players : Map<string, Player>  = room ? room.players : new Map<string, Player>();
                    let join_player : Player | undefined = onlinePlayers.get(json.player_id);

                    if(join_player) {
                        room?.Add(join_player);
                        room?.readied_players.set(join_player.id, false);
                        join_player.in_room = true;
                    }
    
                    //send host info to join player
                    let playersInRoom = {
                        event_name : "joined",
                        players : players ? GetPlayersInfo(players) : null
                    }
                    worker.postMessage({socketId : json.sessionId, data : playersInRoom})
                    // //server.send(JSON.stringify(data), 0, JSON.stringify(data).length, json.port, json.address);
                    
                    //send join player info to other players in room
                    let joinPlayerInfo = {
                        event_name : "new player join",
                        player_id : join_player?.id,
                        player_name : join_player?.name
                    }

                    for(const [key, player] of players){
                         if(key != json.player_id) 
                            worker.postMessage({socketId : player.sessionId, data : joinPlayerInfo});
                    }
                    
                    //console.log(GetPlayersInfo(players));
                    
                    break;
                //case "start":
                    // let pl : Player | undefined = onlinePlayers.get(json.player_id);
                    // if(pl && !pl.in_room) {
                    //     rooms.set(pl.id, new Room(pl, json._event.name, json._event.game_mode));
                    //     pl.in_room = true;
                    //     rooms.get(pl.id)?.readied_players.set(pl.id, true);
                    //     rooms.get(pl.id)?.StartGame();
                    // }
                //    break;
                default:
                    for(let [key, room] of rooms)
                    {
                        if(room.players.has(json.player_id))
                        {
                            room.RoomListener(worker, rooms, json);
                            break;
                        }
                    }
                    break;
                };
                // console.log(json);
        processBuffer();
    }

    processBuffer();
    setInterval(() => console.log(rooms.size), 1000);

} else {

    let sessions : Map<string, net.Socket> = new Map<string, net.Socket>();

    const server = net.createServer((socket : net.Socket) => {

        socket.on("readable", () => {
            let data : Buffer = socket.read();
            if(data !== null) parentPort.postMessage(data);
        });

        socket.on('error', () => {});

        let socketId : string = v4();

        sessions.set(socketId, socket);
        let sessionInfo = {
            event_name : "provide session id",
            id : socketId
        }
        socket.write(AddLengthField(JSON.stringify(sessionInfo)), () => console.log("provided session id"));

    });

    server.listen(9999, '0.0.0.0', () => {
        console.log("server On");
    })

    function AddLengthField(data : string)
    {
        let sendBuffer : Buffer = Buffer.alloc(4 + data.length); //4B for length field
        sendBuffer.writeInt32LE(data.length, 0);
        sendBuffer.write(data , 4);
        return sendBuffer;
    }

    parentPort.on('message', (json : any) => {
        sessions.get(json.socketId)?.write(AddLengthField(JSON.stringify(json.data)));
    })
}