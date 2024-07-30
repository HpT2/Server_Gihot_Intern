import * as net from 'net'
import Room from "./src/room";
import Player from "./src/player";
import { v4 } from 'uuid';
const { Worker, isMainThread, parentPort } = require('worker_threads');
import { Mutex } from 'async-mutex';
import { GetPlayersInfo, GetRoomsInfo } from "./src/function";

const tick_rate = 1 / 40;
export const TICK_RATE = tick_rate;

const maxDataLength: number = 4;

let onlinePlayers: Map<string, Player> = new Map<string, Player>();
let rooms: Map<string, Room> = new Map<string, Room>();

const dbConnect = require('./db_connection');

export function RemoveRoom(id: string) {
    rooms.delete(id);
}

export function RemovePlayer(id: string)
{
    onlinePlayers.delete(id);
}

export async function Update(id : string, field : string[], value: any[])
{
    let updateField : any = [];
    for(let i = 0; i < field.length; i++) 
    {
        updateField.push(`${field[i]}=${value[i]}`);
    }
    updateField = updateField.join(',');
    let query = `Update \`characterInfo\` set ${updateField} where id='${id}'`;
    //console.log(query);
    return new Promise((resolve, reject) => {
        dbConnect.query(query, (err : any, res : any) => {
            console.log("UPDATE",query, err, res);
            resolve(res);
        })
    })
}

export async function Select(id? : string, name? : string, field? : string[])
{
    let selectField = field ? field?.join(',') : '*';
    let query = "";
    query = `select ${selectField} from \`characterInfo\` where id='${id}' or name='${name}'`;
    return new Promise((resolve, reject) => {
        dbConnect.query(query, (err : any, res : any) => {
            console.log(")))(((",err, res,query);
            resolve(res[0]);
        })
    });
}

export async function Insert(field : string[], value : any[])
{
    let fields = field.join(',');
    let values = value.join(',');
    let query = `insert into \`characterInfo\` (${fields}) values (${values})`;
    return new Promise((resolve, reject) => {
        dbConnect.query(query, (err : any, res : any) => {
            query = `select * from \`characterInfo\` where id='${field[0]}'`;
            dbConnect.query(query, (err : any, res : any) => {
                resolve(res[0]);
            })
        });
    }); 
}

if (isMainThread) {

    const worker = new Worker(__filename);
    let bufferStream: Buffer = Buffer.from('');
    let bufferMutex = new Mutex();
    worker.on("message", (msg: any) => {
        handleSocketMsg(msg);

    })
    async function handleSocketMsg(msg : any)
    {
        if(!msg.event)
        {
           const release = await bufferMutex.acquire();
           bufferStream = Buffer.concat([bufferStream, msg.data]);
           release();
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

    async function HanldeFirstConnect(json : any)
    {
        let d : any;
        let playerInfo : any =  await Select(undefined ,json._event.name, undefined);
        console.log(playerInfo);
        if(playerInfo)
        {
            d = {
                event_name: "provide id",
                id: playerInfo.id,
                player_name: playerInfo.name,
                gun_id: 1,
                info : playerInfo
            }

            let thisPlayer: Player = new Player(playerInfo.id, json.sessionId, 1, playerInfo.name);
            onlinePlayers.set(playerInfo.id, thisPlayer);
        }
        else
        {
            let playerID: string = v4();
            let thisPlayer: Player = new Player(playerID, json.sessionId, 1, json._event.name);
            onlinePlayers.set(playerID, thisPlayer);

            let field = ["id", "name", "coin", "health", "critrate", "damage", "critdmg", "lifesteal", "firerate"];
            let value = [`"${playerID}"`, `"${json._event.name}"`, 0, 0, 0, 0, 0, 0, 0];
            let res = await Insert(field, value);       

            d = {
                event_name: "provide id",
                id: playerID,
                player_name: thisPlayer.name,
                gun_id: thisPlayer.gun_id,
                info : res 
            }

            
        }
        //console.log(JSON.stringify(d));
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
            event_name : "pong",
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

    async function HandleUpdateAttr(json : any)
    {
         let value : number = 0;
         let field : any = {
            "health" : 0,
            "critrate" : 1,
            "critdmg" : 2,
            "damage" : 3,
            "lifesteal" : 4,
            "firerate" : 5
         };
         switch(json._event.fieldToUpdate)
         {
            case "health":
                value = json._event.health;
                break;
            case "coin":
                value = json._event.coin;
                break;
            case "damage":
                value = json._event.damage;
                break;
            case "critdmg":
                value = json._event.critdmg;
                break;
            case "critrate":
                value = json._event.critrate;
                break;
            case "firerate":
                value = json._event.firerate;
                break;
            case "lifesteal":
                value = json._event.lifesteal;
                break;
         }
         await Update(`${json.player_id}`, [json._event.fieldToUpdate, "coin"], [value, json._event.coin]);
         //console.log(JSON.stringify(res));
         let data = {
            event_name : "update perm attr",
            field : field[json._event.fieldToUpdate],
            value : value,
            fieldAsString : json._event.fieldToUpdate
         }

         worker.postMessage({ socketId: json.sessionId, data: data });
    }

    const eventHandler : any = {
        'first connect'     : HanldeFirstConnect,
        'create_rooms'      : HandleCreateRoom,
        'get_rooms'         : HandleGetRooms,
        'join_room'         : HandleJoinRoom,
        'ping'              : HandlePing,
        'update attribute'  : HandleUpdateAttr,
        'other'             : HandleOther
    }

    async function processBuffer() {
        await waitForBuffer(4);

        let release = await bufferMutex.acquire();
        let length: number = parseInt(bufferStream.subarray(0, maxDataLength).toString("hex"), 16);
        //console.log(length);
        if(length < 1000) 
        {
            release();
            await waitForBuffer(4 + length + 1);
        }
        else 
        {
            bufferStream = Buffer.from(''); 
            console.log("length failed: " + length);
            release();
            return;
        }
        
        release = await bufferMutex.acquire();

        let dataBuffer : Buffer = bufferStream.subarray(maxDataLength, maxDataLength + length);
        let data: string = dataBuffer.toString('utf-8');
        let sumBuffer : Buffer = bufferStream.subarray(maxDataLength + length, maxDataLength + length + 1);
        let sumData : number = parseInt(sumBuffer.toString("hex"), 16);

        bufferStream = bufferStream.subarray(maxDataLength + length + 1, bufferStream.length);
        release();

        if(!checkSum(dataBuffer, sumData))
        {
            console.log("check sum failed with corrupted data: " + data);
            return;
        } 
        // else 
        // {
        //     //bufferStream = bufferStream.subarray(maxDataLength + length + 1, bufferStream.length);
        // }

        

        let json: any = JSON.parse(data);
    
        const handler : any = eventHandler[json._event.event_name];
            
        if(handler) handler(json);
        else eventHandler['other'](json);
        
        
    }

    async function Run()
    {
        //let processCount = 0;
        
        while(true)
        {
            //console.log(processCount);
            await processBuffer();
            //processCount++;
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
            id: socketId,
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