import Player from "./player";
import Room from "./room";
import * as dgram from 'dgram';

class Game {

    players : Map<string, Player>;
    room : Room;
    spawner : NodeJS.Timeout | null;
    Listener : (msg : Buffer, rInfo : dgram.RemoteInfo) => void;
    playerSpawnPos : any[] = [];
    client_side_loading : number = 0;
    constructor(players : Map<string, Player>, room : Room)
    {
        this.players = players;
        this.room = room;
        this.spawner = null;

        this.Listener = (msg : Buffer, rInfo : dgram.RemoteInfo) => {
            this.GameListener(msg, rInfo);
        };

        let i : number = 0;
        for(const [key, player] of this.players)
        {
            this.playerSpawnPos.push({
                player_id : player.id,
                spawn_pos : [0 + i, 0, 0 + i]
            });
            i++;
        }
        this.AddListener();
    }

    Run() : void {
        // for(let i = 0; i < this.players.length; i++)
        // {
        //     this.players[i].socket.on("data", (data : any) => {
        //         console.log(data);
        //     });
        // }
    }

    AddListener() {
       this.room.server.on('message', this.Listener);
    }

    GameListener(data : Buffer, rInfo : dgram.RemoteInfo) : void {

        //parse data
        const receivedData = data.toString('utf-8');
        let json : any = JSON.parse(receivedData);
        if(!this.players.get(json.player_id)) return;

        switch(json._event.event_name)
        {
            case 'done loading':
                this.client_side_loading++;
                if(this.client_side_loading == this.players.size) this.EmitToAllPlayer("spawn player", this.playerSpawnPos);
                break;
            case 'move':
                console.log(json);
                break;
        }

    }

    EmitToAllPlayer(event: string, data : any)
    {
        let d : any = {
            event_name : event,
            data : data
        }
        let json : string = JSON.stringify(d);
        for (const [key, player] of this.players)
        {
            //send data
            this.room.server.send(json, 0, json.length, player.port, player.address);
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
        
    }
}

export default Game;

