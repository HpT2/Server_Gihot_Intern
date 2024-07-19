import Game from "./game";
import { TICK_RATE } from "../start_server2";
import Player from "./player";
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
    constructor(players : any)
    {
        super();
        this.id = 2;
        for(const [key, player] of players) {
            this.maxHP += player.maxHP;
        }
        this.maxHP /= players.size;
        this.curHP = this.maxHP;
        this.timeToEnd = 100;
  
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
        this.timeToEnd -= TICK_RATE;
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
    startingScore:  number = 0;
    events: string[] = [];
    currentEvent: string;
    constructor() {
        super();
        this.id = 4;
        this.events = ["Kill Enemies", "Gain EXP", "No Get Hit", "No PowerUp"]
        this.currentEvent = this.events[Math.floor(Math.random() * this.events.length)];
        this.timeToEnd = 3;
        switch (this.currentEvent) {
            case "Kill Enemies":
                this.goal = GetRandom(25, 45);
                this.startingScore = 0;
                break;
            case "Gain EXP":
                this.goal = GetRandom(200, 500);
                this.startingScore = 0;
                break;
            case "No Get Hit":
                this.goal = GetRandom(3, 7);
                this.startingScore = 0;
                break;
            case "No PowerUp":
                this.goal = GetRandom(3, 7);
                this.startingScore = 0;
                break;
            default:
                break;
        }
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
            quick: {
                currentEvent : this.currentEvent,
                goal: this.goal,
                startingScore: this.startingScore
            }
        };
    }

    Tick(): void {
        super.Tick();
        this.timeToEnd -= TICK_RATE;
        if(this.timeToEnd < 0) {
            this.end = true;
            this.endState = true;
        }
    }
    Process(json: any): void {
        super.Process(json);
        //TODO: @Tung
        console.log("yepScore: ", this.startingScore);
        switch (this.currentEvent) {
            case "Kill Enemies":
                this.startingScore += json.enemyKill;
                if (this.startingScore >= this.goal) {
                    this.end = true;
                    this.endState = true;
                }
                break;
            case "Gain EXP":
                this.startingScore += json.expGained;
                if (this.startingScore >= this.goal) {
                    this.end = true;
                    this.endState = true;
                }
                break;
            case "No Get Hit":
                if (json.getHit) {
                    this.startingScore++;
                } else if (this.startingScore >= this.goal) {
                    this.end = true;
                    this.endState = true;
                }
                break;
            case "No PowerUp":
                if (json.powerUpTaken) {
                    
                } 
                if (this.startingScore >= this.goal) {
                    this.end = true;
                    this.endState = true;
                }
                break;
            default:
                break;
            
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
        2 : ShareAttributeEvent,
        3 : OnePermaDeathEvent,
        4 : QuickTimeEvent,
        5 : RaidBossEvent
    };

    constructor(game : Game)
    {
        this.currentEvents = new Map<number, GameEvent>();
        this.timeToNextEvent = 2;
        this.game = game;
        this.pendingEvent = [0, 2, 3, 4, 5];
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

        if(this.timeToNextEvent > 0) this.timeToNextEvent -= TICK_RATE;
        else 
        {
            //random event: 
            //let r : number = Math.floor(Math.random() * pendingEvent.length);
            //this.pendingEvent.splice(this.pendingEvent.indexOf(r), 1);
            let r = 4;
            let ev = new this.eventList[r](this.game.players);
            this.currentEvents.set(r, ev);
            this.timeToNextEvent = Math.floor(Math.random() * 2) + 1;
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