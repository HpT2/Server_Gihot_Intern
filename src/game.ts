import Player from "./player";
import Room from "./room";
import Creep from "./creep";
import * as dgram from 'dgram';
import { GetRandom } from "./function";

class Game {

    players : Map<string, Player>;
    room : Room;
    spawner : NodeJS.Timeout | null;
    playerSpawnPos : any[] = [];
    client_side_loading : number = 0;
    tick_rate = 1 / 50;
    current_tick = 0;
    constructor(players : Map<string, Player>, room : Room)
    {
        this.players = players; 
        this.room = room;
        this.spawner = null; 
        let i : number = 0;
        for(const [key, player] of this.players)
        {
            player.position = {x : 0 + i, y : 1, z : 0 + i};
            this.playerSpawnPos.push({
                player_id : player.id,
                spawn_pos : {
                    x : 0 + i, 
                    y: -2, 
                    z :0 + i
                },
                gun_id : player.gun_id
            });
            i++;
        }  
    }

    Run(worker : any) : void {
        // for(let i = 0; i < this.players.length; i++)
        // {
        //     this.players[i].socket.on("data", (data : any) => {
        //         console.log(data);
        //     });
        // } 
        //setInterval(() => this.PredictPlayerPosition(), 1000 / 80);
        //setInterval(() => this.EmitPlayersState(worker), 1000 / 10); 
        //this.FixedUpdate(worker);
        
        setInterval(() => this.FixedUpdate(worker), this.tick_rate * 1000);
    }

    Tick()
    {
        // this.players.forEach((player, _) => {
        //     if(!player.isColliding){
        //         player.position.x += player.velocity.x * this.tick_rate;
        //         player.position.z += player.velocity.z * this.tick_rate;
        //     }
        // });
        //console.log(this.current_tick);
    }

    FixedUpdate(worker : any)
    {  
        //process
        this.Tick(); 
        
        if(this.current_tick % 3) this.EmitPlayersState(worker);

        this.current_tick++;
    }

    GetPlayersState() : any  
    {
        let states : any = [];  
        this.players.forEach((player, _) => {
            let data = {
                player_id : player.id, 
                gun : player.gun_id,
                velocity : player.velocity,
                rotation : player.rotation,
                position : player.position
            }
            states.push(data);
        }) 
        return states;
    }
 
    EmitPlayersState(worker : any)
    {
        let data = {
            event_name : "update players state",
            server_tick : this.current_tick,
            states : this.GetPlayersState()
        }
        this.EmitToAllPlayer(worker, data);
    }

    GetMagnidtude(vector : any)
    {
        return vector.x * vector.x + vector.z * vector.z;
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

                    this.Run(worker); 

                    // setTimeout(() => {
                    //     Creep.getInstance().OnGameStart(this.room);
                    //     Creep.getInstance().StartSpawnProcess(this.room, worker);
                    // }, 1000); 
                }
                break;
            case 'player state': 
                let playerState = this.players.get(json.player_id);
                if(playerState){
                    playerState.velocity = json._event.velocity;
                    playerState.rotation = json._event.rotation;
                    playerState.position = json._event.position; 
                    playerState.isColliding = json._event.isColliding;
                }

                // let data = {
                //     event_name : "update player velocity",
                //     player_id : json.player_id, 
                //     velocity : json._event.velocity,
                //     rotation : json._event.rotation, 
                //     position : json._event.position
                // }

                // this.EmitToAllPlayer(worker, data);
                //this.EmitPlayersState(worker);
                break;

                //this.EmitToAllPlayer(worker, dataPositon);

            case "player position":
                let playerPos = this.players.get(json.player_id);
                if(playerPos){
                    playerPos.position = json._event.position;
                }

                let dataPosition = {
                    event_name : "update player position",
                    player_id : json.player_id, 
                    position : json._event.position 
                }

                this.EmitToAllPlayer(worker, dataPosition);

                break;
            case "game end":
                this.Done();
                break;
        }
    }

    EmitToAllPlayer(worker: any, json : any)  
    {
        for (const [key, player] of this.players)
        {
            //console.log(player.id);
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

