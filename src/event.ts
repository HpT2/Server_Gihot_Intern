class GameEvent
{
    Tick : (() => void);
    constructor()
    {
        this.Tick = () => {}
    }
}

class Event1 extends GameEvent{

}

class Event2 extends GameEvent {

}

//others


//end event

class EventManager
{
    currentEvent : null | GameEvent;
    timeToStartEvent : number;
    tick_rate : number = 1/40;
    eventList : any = {
        0 : Event1,
        1 : Event2,
        //other
    };

    constructor()
    {
        this.currentEvent = null;
        this.timeToStartEvent = 100;
    }

    Tick()
    {
        if(this.currentEvent) this.currentEvent.Tick();
        else
        {
            if(this.timeToStartEvent > 0) this.timeToStartEvent -= this.tick_rate;
            else 
            {
                //random event: this.currentEvent = new this.eventList[random]();

            }
        }
    }

    GetEventInfo()
    {
        //do sth
    }
}

