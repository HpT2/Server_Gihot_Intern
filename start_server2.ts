import * as net from 'net'
import Room from "./src/room";
import Player from "./src/player";
import { v4 } from 'uuid';
const { Worker, isMainThread, parentPort } = require('worker_threads');

import { GetPlayersInfo, GetRoomsInfo } from "./src/function";

const tick_rate = 1 / 40;
export const TICK_RATE = tick_rate;

const maxDataLength: number = 4;

let onlinePlayers: Map<string, Player> = new Map<string, Player>();
let rooms: Map<string, Room> = new Map<string, Room>();

export function RemoveRoom(id: string) {
    rooms.delete(id);
}

export function RemovePlayer(id: string)
{
    onlinePlayers.delete(id);
}

if (isMainThread) {

    const worker = new Worker(__filename);
    let usingBuffer : boolean = false;
    let bufferStream: Buffer = Buffer.from('');
    worker.on("message", (msg: any) => {
        handleSocketMsg(msg);

    })

    async function handleSocketMsg(msg : any)
    {
        if(!msg.event)
        {
           await waitForBufferLock();
           usingBuffer = true;
           bufferStream = Buffer.concat([bufferStream, msg.data]);
           usingBuffer = false;
        }
        else if(msg.event == "client disconnect")
        {
                //do sth
            for(const [key, player] of onlinePlayers)
            {
                if(player.sessionId == msg.id)
                {
                    if(player.in_room)
                    {
                        for (let [key, room] of rooms) {
                            if (room.players.has(player.id)) {
                                room.PlayerQuit(player.id, worker, rooms);
                                break;
                            }
                        }
                    }
                    else RemovePlayer(player.id);
                    break;
                }
            }
        }
    }

    function waitForBuffer(size: number) {
        return new Promise(function (resolve, reject) {
            const checkBuffer = () => {
                //console.log(bufferStream.length); 
                if (bufferStream.length >= size) resolve(0);
                else setTimeout(checkBuffer, 0);
            }
            checkBuffer();
        });
    }

    function waitForBufferLock()
    {
        return new Promise(function (resolve, reject) {
            const waitLock = () => {
                if(!usingBuffer) resolve(0);
                else setTimeout(waitLock, 0); 
            }
            waitLock();
        })
    }

    function checkSum(buffer : Buffer, sum : number) : boolean
    {
        let checkSum = 0;
        for(let i = 0; i < buffer.length; i++)
        {
            checkSum = (checkSum + buffer[i]) % 256;
        }
        //console.log(checkSum, sum);
        return checkSum == sum;
    }

    function HanldeFirstConnect(json : any)
    {
        let playerID: string = v4();
        let thisPlayer: Player = new Player(playerID, json.sessionId, 1, json._event.name);
        onlinePlayers.set(playerID, thisPlayer);

        let d = {
                event_name: "provide id",
                id: playerID,
                player_name: thisPlayer.name,
                gun_id: thisPlayer.gun_id
            }

        worker.postMessage({ socketId: json.sessionId, data: d });
    }

    function HandleCreateRoom(json : any)
    {
        let player: any = onlinePlayers.get(json.player_id);
        rooms.set(player.id, new Room(player, json._event.name, json._event.game_mode));
        rooms.get(player.id)?.readied_players.set(player.id, true);
        player.in_room = true;
    }

    function HandleGetRooms(json : any)
    {
        let roomsArr: Room[] | undefined = Array.from(rooms.values());
        let roomsData = {
            event_name: 'rooms',
            rooms: GetRoomsInfo(roomsArr)
        }
        worker.postMessage({ socketId: json.sessionId, data: roomsData });
    }

    function HandleJoinRoom(json : any)
    {
        let room: Room | undefined = rooms.get(json._event.room_id);
        let players: Map<string, Player> = room ? room.players : new Map<string, Player>();
        let join_player: Player | undefined = onlinePlayers.get(json.player_id);

        if (join_player) {
            room?.Add(join_player);
            room?.readied_players.set(join_player.id, false);
            join_player.in_room = true;
        }

        //send host info to join player
        let playersInRoom = {
            event_name: "joined",
            players: players ? GetPlayersInfo(players) : null
        }
        worker.postMessage({ socketId: json.sessionId, data: playersInRoom })

        //send join player info to other players in room
        let joinPlayerInfo = {
            event_name: "new player join",
            player_id: join_player?.id,
            player_name: join_player?.name
        }

        for (const [key, player] of players) {
            if (key != json.player_id)
                worker.postMessage({ socketId: player.sessionId, data: joinPlayerInfo });
        }

    }

    function HandlePing(json : any)
    {
        let pingData = {
            event_name : "pong"
        }

        worker.postMessage({ socketId: json.sessionId, data: pingData });
    }

    function HandleOther(json : any)
    {
        for (let [key, room] of rooms) {
            if (room.players.has(json.player_id)) {
                room.RoomListener(worker, rooms, json);
                break;
            }
        }
    }

    const eventHandler : any = {
        'first connect' : HanldeFirstConnect,
        'create_rooms'  : HandleCreateRoom,
        'get_rooms'     : HandleGetRooms,
        'join_room'     : HandleJoinRoom,
        'ping'          : HandlePing,
        'other'         : HandleOther
    }

    async function processBuffer() {
        await waitForBuffer(4);
        await waitForBufferLock();
        usingBuffer = true;

        let length: number = parseInt(bufferStream.subarray(0, maxDataLength).toString("hex"), 16);
        
        let dataBuffer : Buffer = bufferStream.subarray(maxDataLength, maxDataLength + length);
        let data: string = dataBuffer.toString('utf-8');
        let sumBuffer : Buffer = bufferStream.subarray(maxDataLength + length, maxDataLength + length + 1);
        let sumData : number = parseInt(sumBuffer.toString("hex"), 16);

        

        if(!checkSum(dataBuffer, sumData))
        {
            console.log("check sum failed with corrupted data: " + data);
            bufferStream = Buffer.from('');
        } 
        else 
        {
            bufferStream = bufferStream.subarray(maxDataLength + length + 1, bufferStream.length);

            let json: any = JSON.parse(data);
    
            const handler : any = eventHandler[json._event.event_name];
            
            if(handler) handler(json);
            else eventHandler['other'](json);
        }

       

        usingBuffer = false;
    }

    async function Run()
    {
        while(true)
        {
            await processBuffer();
        }
    }

    Run();
    //setInterval(() => console.log(rooms.size), 1000);

} else {

    interface CustomSocket extends net.Socket
    {
        id : string;
    }

    let sessions: Map<string, net.Socket> = new Map<string, CustomSocket>();

    const server = net.createServer((socket: net.Socket) => {
        let socketId: string = v4();
        
        const customSocket = socket as net.Socket & {id : string};
        customSocket.id = socketId;

        customSocket.on('error', () => { });
        
        let sessionInfo = {
            event_name: "provide session id",
            id: socketId
        }

        sessions.set(socketId, customSocket);

        socket.write(PrepareData(JSON.stringify(sessionInfo)), () => console.log("provided session id"));

        customSocket.on("readable", () => {
            let data: Buffer = socket.read();
            if(data !== null) parentPort.postMessage({data : data, id : customSocket.id});
        });

        customSocket.on("close", () => {
            parentPort.postMessage({data : null, id : customSocket.id, event : "client disconnect"});
            sessions.delete(customSocket.id);
        });
    });

    server.listen(9999, '0.0.0.0', () => {
        console.log("server On");
    })

    function calcSum(data : string)
    {
        let dataBuf = Buffer.from(data);
        let sum = 0;
        dataBuf.forEach((byte) => {
            sum = (sum + byte) % 256;
        });

        return sum;
    }

    //Add length and check sum
    function PrepareData(data: string) {
        let sendBuffer: Buffer = Buffer.alloc(4 + data.length + 1); //4B for length field, 1B for check sum
        sendBuffer.writeInt32LE(data.length, 0);
        sendBuffer.write(data, 4);
        sendBuffer[4 + data.length] = calcSum(data);
        return sendBuffer;
    }

    parentPort.on('message', (json: any) => {
        sessions.get(json.socketId)?.write(PrepareData(JSON.stringify(json.data)));
    })
}

export default rooms;