import Player from "./player";
import Room from "./room";
class Game {

    players : Player[];
    room : Room;
    spawner : NodeJS.Timeout | null;
    Listener : (msg : string) => void;

    constructor(players : Player[], room : Room)
    {
        this.players = players;
        this.room = room;
        this.spawner = null;

        this.Listener = (msg : string) => {
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
        player.socket.on('data', this.Listener);
    }

    GameListener(msg :string) : void {
        console.log(msg);
    }

    EmitToAllPlayer(event: string, data : any)
    {
        for(let i = 0; i < this.players.length; i++)
        {
            this.players[i].socket.write('event: data');
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

        for(let i = 0; i < this.players.length; i++) this.players[i].socket.removeListener('data', this.Listener);

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

