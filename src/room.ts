import Player from "./player";
import Game from "./game";

class Room {
    players : Map<string, Player>;
    readied_players : Map<string, boolean>;
    id : string;
    locked : boolean;
    game : Game | null;
    name : string;
    game_mode : string;

    constructor(player : Player, name :string, game_mode : string)
    {
        this.id = player.id;
        this.players = new Map<string, Player>();
        this.readied_players = new Map<string, boolean>();
        this.locked = false;
        this.game = null;
        this.name = name;
        this.game_mode = game_mode;
        //this.server = ;
        this.Add(player);
        //this.server.on("message", this.Listener);
    }

    Add(player : Player) : boolean
    {
        if(this.locked) return false;
        this.players.set(player.id, player);
        //this.AddListener(player);
        return true;
    }

    RoomListener(worker : any, rooms : Map<string, Room>, json : any) : void {
        
        switch(json._event.event_name)
        {
            case 'start': 
                this.StartGame(worker);
                break;
            case 'ready':
                this.readied_players.set(json.player_id, !this.readied_players.get(json.player_id));
                // console.log(this.readied_players.get(json.player_id));
                for(const [key, value] of this.readied_players)
                {
                    if(value == false){
                        let dt : any = {
                            event_name : "not all player ready"
                        }
                        let host_player : Player | undefined = this.players.get(this.id);
                        worker.postMessage({socketId : host_player?.sessionId, data : dt});
                        return;
                    }
                }

                let dt : any = {
                    event_name : "all player ready"
                }

                let host_player : Player | undefined = this.players.get(this.id);
                worker.postMessage({socketId : host_player?.sessionId, data : dt});
                break;
            case 'kick_player':
                let kickedplayer:Player | undefined =this.players.get(json._event.player_id);
                
                this.RemovePlayer(json._event.player_id);
                
                let dataKicked = {
                    event_name : 'kicked',
                }

                if(kickedplayer) 
                {
                    kickedplayer.in_room = false;
                    worker.postMessage({socketId : kickedplayer.sessionId, data : dataKicked});
                }

                let dataKick={
                    event_name : 'kick',
                    player_id : json._event.player_id,
                    host_id: json._event.host_id
                }
                for(const [key, player] of this.players)
                {
                    worker.postMessage({socketId : player.sessionId, data : dataKick});
                }
                // console.log(data1);
                break;
            case 'leave':
                let pl : Player | undefined = this.players.get(json._event.player_id);
                if(pl) pl.in_room = false;
                this.PlayerOutRoom(worker, json.player_id, rooms);
                break;
            case 'choosegun':
                let _pl : Player | undefined =this.players.get(json.player_id);
                if(_pl) _pl.gun_id = json._event.gun_id;
                break;
            default:
                this.game?.GameListener(worker, json);
                break;
        }
    }

    RemovePlayer(id : string)
    {
        this.players.delete(id);
    }

    PlayerOutRoom(worker : any, player_id : string, rooms : Map<string, Room>)
    {
        if(player_id == this.id) {
            this.DeleteRoom(worker, rooms);
        }
        else {
            this.RemovePlayer(player_id);
            let dataLeave : any = {
                event_name : "player leave",
                player_id : player_id,
                host_id : this.id
            }
            for(const [key, player] of this.players) 
            {
                worker.postMessage({socketId : player.sessionId, data : dataLeave});
            }
        }
        //send sth back to confirm
    }

    DeleteRoom(worker : any, rooms : Map<string, Room>)
    {
        //for(let i = 0; i < this.players.length; i++) this.players[i].socket.removeListener('data', this.Listener);
        let dataDisband : any = {
            event_name : 'disband',
        }
        for(const [key, player] of this.players) 
        {
            player.in_room = false;
            if(player.id != this.id) 
            {
                worker.postMessage({socketId : player.sessionId, data : dataDisband});
            }
        }
        this.players.clear();
        rooms.delete(this.id);
    }

    StartGame(worker : any)
    {
        //init game state
        this.game = new Game(this.players, this);
        let dataStart : any = {
            event_name : "start"
        }
        for(const [key, player] of this.players)
        {
            worker.postMessage({socketId : player.sessionId, data : dataStart});
           // this.server.send(JSON.stringify(d1), 0, JSON.stringify(d1).length, value.port, value.address);
        }
        this.locked = true;
    }

    Done() : void
    {
        this.game = null;
        this.locked = false;
    }
}

export default Room;