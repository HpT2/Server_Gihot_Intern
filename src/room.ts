import Player from "./player";
import Game from "./game";
import { Socket } from "socket.io";

class Room {
    firstPlayer : Player;
    players : Player[];
    id : string;
    locked : boolean;
    game : Game | null;

    constructor(player : Player)
    {
        this.firstPlayer = player;
        this.id = player.id;
        this.players = [this.firstPlayer];
        this.locked = false;
        this.game = null;
        this.AddListener(this.firstPlayer.socket);
    }

    Add(player : Player) : boolean
    {
        if(this.locked) return false;
        this.players.push(player);
        this.Add(player.socket);
        return true;
    }

    AddListener(socket : Socket)
    {
        socket.on("event", (msg) => {
            console.log(msg);
        });
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