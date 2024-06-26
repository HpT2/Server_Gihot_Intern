import * as net from 'net'
import Player from './player';
import Room from './room';

export function GetPlayerByID(id : string, onlinePlayers : Player[]) : Player 
{
    let i : number = onlinePlayers.findIndex((player) => player.id == id);
    return onlinePlayers[i];
}

export function SendRoomsInfoToClient(socket : net.Socket, Rooms : Room[])
{
    let data =  {
        event_name : 'rooms',
        rooms : GetRoomsInfo(Rooms)
    }
    console.log(data);
    socket.write(JSON.stringify(data));
}

function GetRoomsInfo(Rooms : Room[]) : any
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

export function GetRoomById(id : string, rooms : Room[]) : Room
{
    let i : number = rooms.findIndex((room) => id == room.id);
    return rooms[i];
}

