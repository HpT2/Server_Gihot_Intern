import Game from "./game";
import { TICK_RATE } from "../start_server2";

class GameEvent
{
    end : boolean = false;
    timeToEnd : number = 0;
    id : number = -1;
    GetInfo() : any {
        return {
            event_id : this.id
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
    constructor()
    {
        super();
        this.id = 1;
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

class OnePermaDeathEvent extends GameEvent {
    constructor()
    {
        super();
        this.id = 2;
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

class RaidBossEvent extends GameEvent {
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

//others


//end event

class EventManager
{
    currentEvents : GameEvent[];
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
        this.timeToNextEvent = 100;
        this.game = game;
    }

    Tick()
    {
        if(this.currentEvents)
        {
            this.currentEvents.forEach((event) => {
                if(event.end || event.timeToEnd <= 0)
                {
                    let evIndex = this.currentEvents.indexOf(event);
                    this.currentEvents.splice(evIndex, 1);
                }
                else event.Tick();
            })
        }

        if(this.timeToNextEvent > 0) this.timeToNextEvent -= TICK_RATE;
        else 
        {
            //random event: 
            let r : number = Math.floor(Math.random() * Object.keys(this.eventList.length).length);
            this.currentEvents.push(new (this.eventList[r])());
            this.timeToNextEvent = Math.floor(Math.random() * 100) + 30;
        }
    }

    GetEventInfo()
    {
        //do sth
        this.game.gameState.event = {
            event_info : [],
            timeToNextEvent : this.timeToNextEvent
        };
        this.currentEvents.forEach((event) => {
            this.game.gameState.event_info.push(event.GetInfo());
        })
    }
}


export default EventManager;