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
            endState : this.endState,
            timeToEnd : this.timeToEnd
        }
    }
    Tick(){
        this.timeToEnd -= TICK_RATE;
    }

    Process(json : any) {

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
    constructor(players : any)
    {
        super();
        this.id = 2;
        for(const [key, player] of players) {
            this.maxHP += player.maxHP;
        }
        this.maxHP /= players.size;
        this.curHP = this.maxHP;
        this.timeToEnd = 30;
  
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
        console.log(this.curHP);
    }

    Process(json: any): void {
        super.Process(json);
        this.TakeDamage(json.damage);
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
    currentEvents : Map<number, GameEvent>;
    timeToNextEvent : number;
    game : Game;
    eventList : any = {
        0 : ChainEvent,
        2 : ShareAttributeEvent,
        3 : OnePermaDeathEvent,
        4 : QuickTimeEvent,
        5 : RaidBossEvent
    };

    constructor(game : Game)
    {
        this.currentEvents = new Map<number, GameEvent>();
        this.timeToNextEvent = 5;
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
            let r = 2;
            let ev = new this.eventList[r](this.game.players);
            this.currentEvents.set(r, ev);
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
                this.currentEvents.delete(event.id);
            }
        })
    }

    ProcessEvent(json : any)
    {
        // console.log(json);
        this.currentEvents.get(json.id)?.Process(json);
    }
}


export default EventManager;