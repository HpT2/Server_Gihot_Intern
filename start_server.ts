import Room from "./src/room";
import Player from "./src/player";
import * as net from "net";
import {v4} from 'uuid';

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
                let player : Player | undefined  = GetPlayerByID(json.player_id);
                if(player) {
                    Rooms.splice(0, 0, new Room(player, json._event.name, json._event.game_mode));
                    //console.log(JSON.stringify(Rooms));
                }
                break;
            //get available room
            case 'get_rooms':
                let data =  {
                    event_name : 'rooms',
                    rooms : GetRoomsInfo()
                }
                console.log(data);
                socket.write(JSON.stringify(data));
                break;
            //join room
            case 'join_rooms':
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

function GetPlayerByID(id : string) : Player | undefined
{
    return onlinePlayers.find((player) => player.id == id);
}

function GetRoomsInfo() : any
{
    let infos : any[] = [];
    for(let i = 0 ; i < Rooms.length ; i++)
    {
        if(Rooms[i].locked) continue;
        let info : {
            id : string,
            name : string,
            game_mode : string
        } =  {
            id : Rooms[i].id,
            name : Rooms[i].name,
            game_mode : Rooms[i].game_mode
        };
        infos.push(info);
    }
    return infos;
}