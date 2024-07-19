import Game from "./game";
import { TICK_RATE } from "../start_server2";
import { GetRandom } from "./function";

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
    constructor(game : Game)
    {
        let players = game.players;
        super();
        this.id = 2;
        for(const [key, player] of players) {
            this.maxHP += player.maxHP;
        }
        this.maxHP /= players.size;
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
        //console.log(this.timeToEnd);
        if(this.timeToEnd < 0)
        {
            this.end = true;
            this.endState = true;
        }
    }

    TakeDamage(damage : number) : void {
        this.curHP -= damage;
        if(this.curHP > this.maxHP) this.curHP = this.maxHP;
        else if(this.curHP <= 0)
        {
            this.end = true;
            this.endState = false;
        }
        //console.log(this.curHP);
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
    goal : number = 0 ;
    currentScore:  number = 0;
    game : Game;

    constructor( game : Game)
    {
        super();
        this.game = game;
        this.id = 4;
        this.timeToEnd = 30;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
            quick : {
                goal : this.goal,
                currentScore : this.currentScore
            }
        };
    }

}

class QuickTimeKillEnemyEvent extends QuickTimeEvent {
    constructor(game : Game) {
        super(game);
        this.goal = game.totalEnemyKilled + GetRandom(20, 30);
    }

    Tick(): void {
        super.Tick();
        
        this.currentScore = this.game.totalEnemyKilled;

        if(this.game.totalEnemyKilled >= this.goal)
        {
            this.end = true;
            this.endState = true;
        }
        else if(this.timeToEnd < 0) 
        {
            this.end = true;
            this.endState = false;
        }
    }
}

class QuickTimePowerUpPickUpEvent extends QuickTimeEvent {
    constructor(game : Game) {
        super(game);
        this.goal = game.totalPowerUpPicked + GetRandom(1, 3);
    }

    Tick(): void {
        super.Tick();
        
        this.currentScore = this.game.totalPowerUpPicked;

        if( this.timeToEnd < 0 && this.game.totalPowerUpPicked < this.goal)
        {
            this.end = true;
            this.endState = true;
        }
        else
        {
            this.end = true;
            this.endState = false;
        }
    }
}

class RaidBossEvent extends GameEvent {
    constructor()
    {
        super();
        this.id = 5;
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
    pendingEvent : number[];
    eventList : any = {
        0 : ChainEvent,
        //1 : null,
        2 : ShareAttributeEvent,
        3 : OnePermaDeathEvent,
        4 : QuickTimeKillEnemyEvent,
        5 : QuickTimePowerUpPickUpEvent,
        6 : RaidBossEvent
    };

    constructor(game : Game)
    {
        this.currentEvents = new Map<number, GameEvent>();
        this.timeToNextEvent = 2;
        this.game = game;
        this.pendingEvent = [2, 4];
    }

    Tick()
    {
        //console.log(this.timeToNextEvent);
        if(this.currentEvents)
        {
            this.currentEvents.forEach((event) => {
                if(!event.end) event.Tick();
            })
        }

        if(this.pendingEvent.length == 0) return;

        if(this.timeToNextEvent > 0) this.timeToNextEvent -= TICK_RATE;
        else 
        {
            //random event: 
            let r : number = Math.floor(Math.random() * this.pendingEvent.length);
            let index = this.pendingEvent[r];
            this.pendingEvent.splice(r, 1);
            //let r = 4;
            console.log(index, this.eventList[index], r);
            let ev = new this.eventList[index](this.game);
            this.currentEvents.set(index, ev);
            this.timeToNextEvent = Math.floor(Math.random() * 0) + 5;
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
                //console.log(typeof(event));
                let eventKey : any = Number(Object.keys(this.eventList).find(key => event instanceof this.eventList[key]));
                this.currentEvents.delete(eventKey);
                this.pendingEvent.push(eventKey);
                //console.log(eventKey);
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