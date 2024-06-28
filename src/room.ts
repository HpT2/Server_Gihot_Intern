import Player from "./player";
import Game from "./game";
import * as dgram from 'dgram';
import RemoveRoom from "../start_server";

class Room {
    players : Map<string, Player>;
    id : string;
    locked : boolean;
    game : Game | null;
    name : string;
    game_mode : string;
    Listener : (msg : Buffer, rInfo : dgram.RemoteInfo) => void;
    server : dgram.Socket;

    constructor(player : Player, name :string, game_mode : string, server : dgram.Socket)
    {
        this.id = player.id;
        this.players = new Map<string, Player>();
        this.locked = false;
        this.game = null;
        this.name = name;
        this.game_mode = game_mode;
        this.server = server;
        this.Listener = (msg : Buffer, rInfo : dgram.RemoteInfo) => {
            this.RoomListener(msg, rInfo);
        };
        this.Add(player);
        this.server.on("message", this.Listener);
    }

    Add(player : Player) : boolean
    {
        if(this.locked) return false;
        this.players.set(player.id, player);
        //this.AddListener(player);
        return true;
    }

    RoomListener(data : Buffer, rInfo : dgram.RemoteInfo) : void {
        
        //parse data
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);
        if(!this.players.get(json.player_id)) return;

        switch(json._event.event_name)
        {
            case 'start':
                break;
            case 'ready':
                break;
            case 'kick':
                break;
            case 'out':
                this.PlayerOutRoom(json.player_id);
                break;
        }
    }

    RemovePlayer(id : string)
    {
        this.players.delete(id);
    }

    PlayerOutRoom(player_id : string)
    {
        if(player_id == this.id) {
            this.DeleteRoom();
        }
        else {
            this.RemovePlayer(player_id);
        }
        //send sth back to confirm
    }

    DeleteRoom()
    {
        //for(let i = 0; i < this.players.length; i++) this.players[i].socket.removeListener('data', this.Listener);
        this.players.clear();
        this.server.removeListener('message', this.Listener);
        RemoveRoom(this.id);
    }

    StartGame()
    {
        //init game state
        this.game = new Game(this.players, this);
        //this.game.Run();
        this.locked = true;

        //emit game started to all players
    }

    Done() : void
    {
        this.game = null;
        this.locked = false;
    }
}

export default Room;