import * as net from 'net'
import Player from './player';
import Room from './room';
import * as dgram from 'dgram';

export function SendRoomsInfoToClient(server : dgram.Socket, Rooms : Map<string, Room>, address : string, port : number)
{
    let rooms : Room[] | undefined = Array.from(Rooms.values());
    let data =  {
        event_name : 'rooms',
        rooms : GetRoomsInfo(rooms)
    }
    console.log(data);
    let msg = JSON.stringify(data);
    server.send(msg, 0, msg.length, port, address);
}

function GetRoomsInfo(Rooms : Room[] | undefined) : any
{
    if(!Rooms) return ;
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



