import Player from "./player";
import Game from "./game";
import * as net from 'net';

class Room {
    players : Player[];
    id : string;
    locked : boolean;
    game : Game | null;
    name : string;
    game_mode : string;
    Listener : (msg : string) => void ;

    constructor(player : Player, name :string, game_mode : string)
    {
        this.id = player.id;
        this.players = [];
        this.locked = false;
        this.game = null;
        this.name = name;
        this.game_mode = game_mode;
        this.Listener = (msg : string) => {
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

    RoomListener(msg : string) : void {
        //console.log(msg);
    }

    RemovePlayer(id : string)
    {
        let index : number = this.players.findIndex((player) => {
            return player.id == id;
        });

        this.players.splice(index);
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