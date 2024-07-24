import Player from "./player";
import Room from "./room";
import Creep from "./creep";
import PowerUp from "./power_up";
import EventManager from "./event";
import { TICK_RATE } from "../start_server2";
class Game {

    players : Map<string, Player>;
    playerLevelUp : Map<string, number>;
    room : Room;
    playerSpawnPos : any[] = [];
    client_side_loading : number = 0;
    current_tick = 0;
    fixedUpdate : any;
    resumeTime = 0;
    resumeFromPause = false;
    doneSpawning = 0;
    score : Map<string, number>;
    gameState : any;
    isPause : boolean = false;
    isLevelUp : boolean = false;
    eventManager : EventManager;
    totalEnemyKilled : number = 0;
    totalPowerUpPicked : number = 0;
    eventHandler : any;

    constructor(players : Map<string, Player>, room : Room)
    {
        this.eventManager = new EventManager(this);
        this.players = players; 
        this.room = room;
        let i : number = 0;
        this.score = new Map<string, number>();
        this.playerLevelUp = new Map<string, number>();
        for(const [key, player] of this.players)
        {
            this.score.set(key, 0);
            this.playerLevelUp.set(key, 0);
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

        this.eventHandler = {
            'done loading'      : this.HandleDoneLoading.bind(this),
            "spawn done"        : this.HandleSpawnDone.bind(this),
            'player state'      : this.HandlePlayerState.bind(this),
            'level up'          : this.HandleLevelUp.bind(this),
            'choose level up'   : this.HandleChooseLevelUp.bind(this),
            'player out'        : this.HandlePlayerOut.bind(this),
            'creep destroy'     : this.HandleCreepDestroy.bind(this),
            'power up pick'     : this.HandlePowerUpPick.bind(this),
            'resume'            : this.HandleResume.bind(this),
            'pause'             : this.HandlePause.bind(this),
            'revive'            : this.HandleRevive.bind(this),
            'game event'        : this.HandleGameEvent.bind(this),
            'game end'          : this.HandleGameEnd.bind(this),
        }




    }

    Run(worker : any) : void {

        this.room.pause = false;
        this.fixedUpdate = setInterval(() => this.FixedUpdate(worker), TICK_RATE * 1000);

        setTimeout(() => {
            Creep.getInstance().OnGameStart(this.room.id);
            Creep.getInstance().StartSpawnProcess(this.room.id);
            PowerUp.getInstance().OnGameStart(this.room.id);
        }, 1000); 
    }

    Tick(worker : any) 
    {
        if(this.isLevelUp)
        {
            let levelUpFlag = false;
            for(const [key, levelUp] of this.playerLevelUp)
            {
                if(levelUp > 0) 
                {
                    levelUpFlag = true;
                    break;
                } 
            }
            if(!levelUpFlag)
            {
                this.isLevelUp = false;
                this.isPause = false;
                Creep.getInstance().StartSpawnProcess(this.room.id);

            }
        }
        if(this.resumeFromPause)
        {
            if(this.resumeTime > 0)
            {
                this.resumeTime -= TICK_RATE;
            }
            else
            {
                this.isPause = false;
                this.resumeFromPause = false;
                Creep.getInstance().StartSpawnProcess(worker);
            }
        }
        if(this.isPause) return;
        let numDead : number = 0;
        this.players.forEach((player, _) => {
            if(this.current_tick - player.last_tick > 10)
            {
                player.velocity = {x : 0, y : 0, z : 0};
                player.isFire = false;
            }
            if(player.isImmutable > 0) {
                player.isImmutable -= TICK_RATE;
            }
            if(player.isDead) numDead++;
        }); 

        if(numDead == this.players.size)
        {
            this.Done(0, worker);
        }

        this.eventManager.Tick();
        //console.log(this.current_tick);
        
    }

    FixedUpdate(worker : any)
    {  
        
        //process
        this.Tick(worker);  
        
        if(this.current_tick % 3 == 0)  this.EmitGameState(worker);
        

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
                isDead : player.isDead,
                speedBoost : player.speedBoost
            }
            if(player.isFire) player.isFire = false;
            states.push(data);
        }) 
        return states;
    }
    
    GetGameState()
    {
        this.gameState = {
            ...this.gameState, 
            player_states : {
                states : this.GetPlayersState()
            },
            isPause : this.isPause,
            resume : {
                isResume : this.resumeFromPause,
                time : this.resumeTime
            },
            isLevelUp : this.isLevelUp
        };
    } 

    EmitGameState(worker : any)
    {
        this.GetGameState();
        this.eventManager.GetEventInfo();
        let data = {
            event_name : "update game state",
            server_tick : this.current_tick,
            state : this.gameState,
        }
        this.EmitToAllPlayer(worker, data);
        this.gameState = {};
    }
 
    GameListener(worker : any, json : any) : void {
        this.eventHandler[json._event.event_name](worker, json);
    }

    PlayerOut(id : string, worker : any)
    {
        let dataOut : any = {
            event_name : "player out",
            player_id : id
        }
        
        this.EmitToAllPlayer(worker, dataOut);
        this.room.RemovePlayer(id);
        this.playerLevelUp.delete(id);
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
        Creep.getInstance().OnGameEnd(this.room.id);
        PowerUp.getInstance().OnGameEnd(this.room.id);
        let dataDone = {
            event_name : "game end",
            result : this.GetScore()
        }

        if(state == 0) this.EmitToAllPlayer(worker, dataDone);

        this.room.Done(state);
    }

    GetScore()
    {
        let res : any = []; 
        for(const [key, value] of this.score)
        {
            let data = {
                player_id : key,
                enemy_kill : value
            }
            //console.log(value);
            res.push(data);
        }
        res.sort((a : any, b : any) => a.enemy_kill - b.enemy_kill);
        return res;
    }

    UpdateEnemyKilled()
    {
        this.totalEnemyKilled++;
    }
    
    UpdatePowerUpPicked()
    {
        this.totalPowerUpPicked++;
    }

    HandleDoneLoading(worker : any, json : any)
    {
        this.client_side_loading++;
        if(this.client_side_loading == this.players.size) 
        {
            let dataDoneLoad : any = { 
                event_name : "spawn player",
                data : this.playerSpawnPos
            }
            this.EmitToAllPlayer(worker, dataDoneLoad);
        }
    }   
    
    HandleSpawnDone(worker : any, json : any)
    {
        this.doneSpawning++;
        if(this.doneSpawning == this.players.size) this.Run(worker); 
    }

    HandlePlayerState(worker : any, json : any)
    {
        let playerState = this.players.get(json.player_id);
        if(playerState && !playerState.isDead){
            playerState.SetState(json);   
                   
            playerState.last_tick = this.current_tick;
        }
    }

    HandleLevelUp(worker : any, json : any)
    {
        this.playerLevelUp.set(json.player_id, this.playerLevelUp.get(json.player_id)! + 1);

        this.isLevelUp = true;
        this.isPause = true;
        Creep.getInstance().OnGameEnd(this.room.id);
        
    }

    HandleChooseLevelUp(worker : any, json : any)
    {
        this.playerLevelUp.set(json.player_id, this.playerLevelUp.get(json.player_id)! -1);
    }

    HandlePlayerOut(worker : any, json : any)
    {
        this.PlayerOut(json.player_id, worker);
        if(this.players.size == 0) this.Done(1, worker);
    }

    HandleCreepDestroy(worker : any, json : any)
    {
        Creep.getInstance().DestroyCreep(json._event.shared_id, json._event.power_up_spawn_info, this.room.id, this);
                
        let sc : any = this.score.get(json.player_id);
        this.score.set(json.player_id, sc + 1);

    }

    HandlePowerUpPick(worker : any, json : any)
    {
        PowerUp.getInstance().PlayerPickUpPowerUp(json._event.shared_id, json._event.player_id, this.room.id, this);
    }

    HandleResume(worker : any, json : any)
    {
        if(!this.resumeFromPause)
        {
            this.resumeFromPause = true;
            this.resumeTime = 3;
        }
    }   

    HandlePause(worker : any, json : any)
    {
        this.isPause = true;
        Creep.getInstance().OnGameEnd(this.room.id);
    }

    HandleRevive(worker : any, json : any)
    {
        let revivePlayer = this.players.get(json._event.revive_player_id);
        if(revivePlayer) {
            
            revivePlayer.isDead = false;
            revivePlayer.isImmutable = 1;
            //console.log(revivePlayer.isDead);
        }
    }

    HandleGameEvent(worker : any, json : any)
    {
        this.eventManager.ProcessEvent(json._event);
    }

    HandleGameEnd(worker : any, json : any)
    {
        this.Done(0, worker);
    }
}

export default Game;

