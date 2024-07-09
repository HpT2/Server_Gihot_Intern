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
    fixedUpdate : any;
    resumeTime = 0;
    resumeFromPause = false;
    constructor(players : Map<string, Player>, room : Room)
    {
        this.players = players; 
        this.room = room;
        this.spawner = null; 
        let i : number = 0;
        for(const [key, player] of this.players)
        {
            player.position = {x : 0 + i * 5, y : 0.7, z : 0 + i * 5};
            player.Setup();
            this.playerSpawnPos.push({
                player_id : player.id,
                spawn_pos : player.position,
                gun_id : player.gun_id
            });
            i++; 
        }   
        this.fixedUpdate = null;
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
        
        this.fixedUpdate = setInterval(() => this.FixedUpdate(worker), this.tick_rate * 1000);

        setTimeout(() => {
            Creep.getInstance().OnGameStart(this.room);
            Creep.getInstance().StartSpawnProcess(this.room, worker);
        }, 1000); 
    }

    Tick(worker : any) 
    {
        let numDead : number = 0;
        this.players.forEach((player, _) => {
            if(this.current_tick - player.last_tick > 10)
            {
                player.velocity = {x : 0, y : 0, z : 0};
                player.isFire = false;
            }
            if(player.isDead) numDead++;
        }); 

        if(numDead == this.players.size)
        {
            this.Done(0, worker);
        }

        if(this.resumeFromPause)
        {
            if(this.resumeTime > 0)
            {
                if(Math.abs(this.resumeTime - Math.round(this.resumeTime)) < 0.01)
                {
                    let dataResumeTime = {
                        event_name : "time to resume",
                        time : Math.round(this.resumeTime)
                    }
                    this.EmitToAllPlayer(worker, dataResumeTime);
                }
                this.resumeTime -= this.tick_rate;
            }
            else
            {
                let dataResume = {
                    event_name : "resume"
                }

                this.EmitToAllPlayer(worker, dataResume);
                this.resumeFromPause = false;
            }
        }
        //console.log(this.current_tick);
        
    }

    FixedUpdate(worker : any)
    {  
        //process
        this.Tick(worker); 
        
        if(this.current_tick % 3 == 0)  this.EmitPlayersState(worker);
        

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
                position : player.position,
                isFire : player.isFire,
                isDead : player.isDead
            }
            if(player.isFire) player.isFire = false;
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

                    let firstResume = {
                        event_name : "resume"
                    }
    
                    this.EmitToAllPlayer(worker, firstResume);

                    this.Run(worker); 
                }

                

                break;
            case 'player state': 
                let playerState = this.players.get(json.player_id);
                if(playerState){
                    playerState.SetState(json);          
                    playerState.last_tick = this.current_tick;
                    
                }
                break;

            case "player out":
                this.PlayerOut(json.player_id, worker);
                if(this.players.size == 0) this.Done(1, worker);
                break;

            case "creep destroy":
                let creepDestroyInfo = {
                    event_name : "destroy creep",
                    creep_id : json._event.creep_id, 
                }

                this.EmitToAllPlayer(worker, creepDestroyInfo);
                break;
            case 'pause':
                // if(json.player_id != this.room.id) break;
                let dataPause = {
                    event_name : "pause",
                }

                this.EmitToAllPlayer(worker, dataPause);
                break;

            case 'resume':
                if(!this.resumeFromPause)
                {
                    this.resumeFromPause = true;
                    this.resumeTime = 3;
                }
                break;
            
            case 'revive':
                let revivePlayer = this.players.get(json._event.player_id);
                if(revivePlayer) revivePlayer.isDead = false;
                break;
            
            case "game end":
                this.Done(0, worker);
                break;
        }  
    }

    PlayerOut(id : string, worker : any)
    {
        let dataOut : any = {
            event_name : "player out",
            player_id : id
        }
        
        this.EmitToAllPlayer(worker, dataOut);
        this.room.RemovePlayer(id);
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

    Done(state : number = 0, worker : any) : void 
    {
        //console.log("done");
        clearInterval(this.fixedUpdate);
        Creep.getInstance().OnRoomDestroy(this.room);
        let dataDone = {
            event_name : "game end"
        }

        if(state == 0) this.EmitToAllPlayer(worker, dataDone);

        this.room.Done(state);
    }

}

export default Game;

