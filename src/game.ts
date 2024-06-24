import { Socket } from "socket.io";
import Player from "./player";
import Room from "./room";
class Game {

    players : Player[];
    room : Room;

    constructor(players : Player[], room : Room)
    {
        this.players = players;
        this.room = room;
    }

    Run() : void {
        for(let i = 0; i < this.players.length; i++)
        {
            this.players[i].socket.on("event", (data : any) => {
                console.log(data);
            });
        }
    }

    EmitToAllPlayer(event: string, data : any)
    {
        for(let i = 0; i < this.players.length; i++)
        {
                this.players[i].socket.emit(event, data);
        }
    }

    Done() : void {
        //emit end event to all players

        //unlock room and delete current match
        this.room.Done();
    }
}

export default Game;