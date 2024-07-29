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
        this.timeToEnd = 100;
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
        }
    }

    Tick(): void {
        super.Tick();
        if(this.timeToEnd < 0) {
            this.end = true;
        }
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
        this.timeToEnd = GetRandom(20, 40);
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


class MoveToTargetEvent extends GameEvent
{
    targetPos : any = [];
    atTarget1 : number = 0;
    atTarget2 : number = 0;
    constructor()
    {
        super();
        this.id = 6;
        this.timeToEnd = GetRandom(20, 40);
        this.targetPos.push({x: 10, y :0, z : 10});
        this.targetPos.push({x: 10, y :0, z : 20});
    }

    GetInfo(): any {
        let data : any = super.GetInfo();
        return {
            ...data,
            goToPos : {
                target1 : this.targetPos[0],
                target2 : this.targetPos[1]
            }
        }
    }

    Tick(): void {
        super.Tick();
        if(this.timeToEnd < 0 && !this.end)
        {
            this.end = true;
            this.endState = false;
        }
        //console.log(this.timeToEnd, this.end);
    }

    Process(json: any): void {
        this.atTarget1 += json.target1;
        this.atTarget2 += json.target2;

        if(this.atTarget1 < 0) this.atTarget1 = 0;
        if(this.atTarget2 < 0) this.atTarget2 = 0;

        if(this.atTarget1 > 0 && this.atTarget2 > 0)
        {
            this.end = true;
            this.endState = true;
        }
        //console.log(this.atTarget1, this.atTarget2);
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
        4 : [QuickTimeKillEnemyEvent, QuickTimePowerUpPickUpEvent],
        5 : RaidBossEvent,
        6 : MoveToTargetEvent
        
    };

    constructor(game : Game)
    {
        this.currentEvents = new Map<number, GameEvent>();
        this.timeToNextEvent = 2;
        this.game = game;
        if(game.players.size > 1) this.pendingEvent = [0, 2, 4, 6];
        else this.pendingEvent = [0, 2, 4];
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
            //console.log(this.pendingEvent);
            let r : number = GetRandom(0, this.pendingEvent.length - 1);
            let index = this.pendingEvent[r];
            this.pendingEvent.splice(r, 1);
            //let r = 4;
            //console.log(index, this.eventList[index], r);
            let ev : any = null;
            if(index == 4) ev = new this.eventList[4][GetRandom(0, this.eventList[4].length - 1)](this.game);
            else ev = new this.eventList[index](this.game);
            this.currentEvents.set(ev.id, ev);
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
                this.currentEvents.delete(event.id);
                this.pendingEvent.push(event.id);
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