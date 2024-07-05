import Player from "./player";
import Room from "./room";
import Creep from "./creep";
import * as dgram from 'dgram';

class Game {

    players : Map<string, Player>;
    room : Room;
    spawner : NodeJS.Timeout | null;
    playerSpawnPos : any[] = [];
    client_side_loading : number = 0;
    constructor(players : Map<string, Player>, room : Room)
    {
        this.players = players; 
        this.room = room;
        this.spawner = null;
        let i : number = 0;
        for(const [key, player] of this.players)
        {
            this.playerSpawnPos.push({
                player_id : player.id,
                spawn_pos : {
                    x : 0 + i, 
                    y: 1, 
                    z :0 + i
                },
                gun_id : player.gun_id
            });
            i++;
        }  
    }

    Run() : void {
        // for(let i = 0; i < this.players.length; i++)
        // {
        //     this.players[i].socket.on("data", (data : any) => {
        //         console.log(data);
        //     });
        // } 
    }

    GameListener(worker : any, json : any) : void {

        //console.log(`Received from client (${rInfo.address}:${rInfo.port}): ${receivedData}`);
        switch(json._event.event_name)
        {
            case 'done loading':
                this.client_side_loading++;
                if(this.client_side_loading == this.players.size) 
                {
                    let dataDoneLoad : any = { 
                        event_name : "spawn player",
                        data : this.playerSpawnPos
                    }
                    this.EmitToAllPlayer(worker, dataDoneLoad);
                    setTimeout(() => {
                        Creep.getInstance().OnGameStart(this.room);
                        Creep.getInstance().StartSpawnProcess(this.room, worker);
                    }, 1000); 
                }
                break;
            case 'move': 
                let dataMove : any = {
                    event_name : "player move",
                    player_id : json.player_id,
                    velocity : json._event.velocity,
                    position : json._event.position,
                    rotation: json._event.rotation
                }
                this.EmitToAllPlayer(worker, dataMove);
                break;
            case "game end":
                this.Done();
                break;
        }

    }

    EmitToAllPlayer(worker: any, json : string)  
    {
        for (const [key, player] of this.players)
        {
            //send data 
            worker.postMessage({socketId : player.sessionId, data : json});
            //this.room.server.send(json, 0, json.length, player.port, player.address);
        }
    }

    Done() : void 
    {
        this.room.Done();
    }

}

export default Game;

