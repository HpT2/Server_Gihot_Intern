import Player from "./player";
import Room from "./room";
class Game {

    players : Player[];
    room : Room;
    spawner : NodeJS.Timeout | null;
    Listener : (msg : Buffer) => void;

    constructor(players : Player[], room : Room)
    {
        this.players = players;
        this.room = room;
        this.spawner = null;

        this.Listener = (msg : Buffer) => {
            this.GameListener(msg);
        };

        for(let i = 0; i < players.length; i++) this.AddListener(players[i]);
    }

    Run() : void {
        // for(let i = 0; i < this.players.length; i++)
        // {
        //     this.players[i].socket.on("data", (data : any) => {
        //         console.log(data);
        //     });
        // }
        this.SpawnEnemy();
    }

    AddListener(player : Player) {
       
    }

    GameListener(data : Buffer) : void {
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);
    }

    EmitToAllPlayer(event: string, data : any)
    {
        for(let i = 0; i < this.players.length; i++)
        {
            
        }
    }

    Done() : void {
        //emit end event to all players

        //unlock room and delete current match
        if(this.spawner)
        {
            clearTimeout(this.spawner);
            this.spawner = null;
        }

        this.room.Done();
    }

    SpawnEnemy() : void
    {
        //random spwan pos

        //send pos to all player
        this.EmitToAllPlayer('spawn', {});
        this.spawner = setTimeout(() => this.SpawnEnemy(), 200);
    }
}

export default Game;

