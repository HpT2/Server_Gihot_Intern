import Player from "./player";
import Room from "./room";
import * as dgram from 'dgram';
class Game {

    players : Map<string, Player>;
    room : Room;
    spawner : NodeJS.Timeout | null;
    Listener : (msg : Buffer, rInfo : dgram.RemoteInfo) => void;

    constructor(players : Map<string, Player>, room : Room)
    {
        this.players = players;
        this.room = room;
        this.spawner = null;

        this.Listener = (msg : Buffer, rInfo : dgram.RemoteInfo) => {
            this.GameListener(msg, rInfo);
        };
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

    AddListener() {
       this.room.server.on('message', this.Listener);
    }

    GameListener(data : Buffer, rInfo : dgram.RemoteInfo) : void {

        //parse data
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);
        if(!this.players.get(json.player_id)) return;

    }

    EmitToAllPlayer(event: string, data : any)
    {
        for (const [key, player] of this.players)
        {
            //send data
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

