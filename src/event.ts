import Game from "./game";
import { TICK_RATE } from "../start_server2";
import Player from "./player";

class GameEvent
{
    end : boolean = false;
    timeToEnd : number = 0;
    id : number = -1;
    endState : boolean = false;
    GetInfo() : any {
        return {
            id : this.id,
            end : this.end,
            endState : this.endState
        }
    }
    Tick(){
        this.timeToEnd -= TICK_RATE;
    }

}

class ChainEvent extends GameEvent{
    constructor()
    {
        super();
        this.id = 0;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
        }
    }

    Tick(): void {
        super.Tick();
    }

}

class ShareAttributeEvent extends GameEvent {
    maxHP : number = 0 ;
    curHP : number ;
    constructor(players : Player[])
    {
        super();
        this.id = 2;
        players.forEach((player) => {
            this.maxHP += player.maxHP;
        })
        this.maxHP /= players.length;
        this.curHP = this.maxHP;
        this.timeToEnd = 10;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
            share : {
                maxHP : this.maxHP,
                curHP : this.curHP
            }
        }
    }

    Tick(): void {
        super.Tick();
        this.timeToEnd -= TICK_RATE;
        if(this.timeToEnd < 0)
        {
            this.end = true;
            this.endState = true;
        }
    }

    TakeDamage(damage : number) : void {
        this.curHP -= damage;
        if(this.curHP <= 0)
        {
            this.end = true;
            this.endState = false;
        }
    }
}

class OnePermaDeathEvent extends GameEvent {
    constructor()
    {
        super();
        this.id = 3;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
        }
    }

    Tick(): void {
        super.Tick();
    }

}

class QuickTimeEvent extends GameEvent {
    constructor()
    {
        super();
        this.id = 4;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
        }
    }

    Tick(): void {
        super.Tick();
    }

}

class RaidBossEvent extends GameEvent {
    constructor()
    {
        super();
        this.id = 5;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
        }
    }

    Tick(): void {
        super.Tick();
    }
    
}

//others


//end event

class EventManager
{
    currentEvents : any[];
    timeToNextEvent : number;
    game : Game;
    eventList : any = {
        0 : ChainEvent,
        1 : ShareAttributeEvent,
        2 : OnePermaDeathEvent,
        3 : QuickTimeEvent,
        4 : RaidBossEvent
    };

    constructor(game : Game)
    {
        this.currentEvents = [];
        this.timeToNextEvent = 10;
        this.game = game;
    }

    Tick()
    {
        if(this.currentEvents)
        {
            this.currentEvents.forEach((event) => {
                if(!event.end) event.Tick();
            })
        }

        if(this.timeToNextEvent > 0) this.timeToNextEvent -= TICK_RATE;
        else 
        {
            //random event: 
            //let r : number = Math.floor(Math.random() * Object.keys(this.eventList).length);
            let r = 1;
            let ev = new this.eventList[r](this.game.players);
            this.currentEvents.push(ev);
            this.timeToNextEvent = Math.floor(Math.random() * 20) + 10;
        }
    }

    GetEventInfo()
    {
        //do sth
        this.game.gameState.game_event = {
            event_info : [],
            timeToNextEvent : this.timeToNextEvent
        };
        this.currentEvents.forEach((event) => {
            this.game.gameState.game_event.event_info.push(event.GetInfo());
            if(event.end) 
            {
                let evIndex = this.currentEvents.indexOf(event);
                this.currentEvents.splice(evIndex, 1);
            }
        })
    }
}


export default EventManager;