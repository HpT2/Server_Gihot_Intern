import Player from "./player";
import Game from "./game";
import * as net from 'net';
import RemoveRoom from "../start_server";

class Room {
    players : Player[];
    id : string;
    locked : boolean;
    game : Game | null;
    name : string;
    game_mode : string;
    Listener : (msg : Buffer) => void ;

    constructor(player : Player, name :string, game_mode : string)
    {
        this.id = player.id;
        this.players = [];
        this.locked = false;
        this.game = null;
        this.name = name;
        this.game_mode = game_mode;
        this.Listener = (msg : Buffer) => {
            this.RoomListener(msg);
        };
        this.Add(player);
    }

    Add(player : Player) : boolean
    {
        if(this.locked) return false;
        this.players.push(player);
        this.AddListener(player.socket);
        return true;
    }

    AddListener(socket : net.Socket)
    {
        socket.on("data", this.Listener);
    }

    RoomListener(data : Buffer) : void {
        //parse data
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);

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
        let index : number = this.players.findIndex((player) => {
            return player.id == id;
        });

        this.players.splice(index);
    }

    PlayerOutRoom(player_id : string)
    {
        if(player_id == this.id) {
            this.players = [];
            RemoveRoom(this.id);
        }
        else {
            this.RemovePlayer(player_id);
        }
        //send sth back to confirm
    }

    DeleteRoom()
    {
        for(let i = 0; i < this.players.length; i++) this.players[i].socket.removeListener('data', this.Listener);
        this.players = [];
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