
class Player{

    name : string;
    sessionId : string;
    id : string;
    gun_id : number = 0;
    in_room : boolean = false;
    position : any = {x : 0, y : 0, z : 0};
    velocity : any = {x : 0, y : 0, z : 0};
    rotation : any = {x : 0, y : 0, z : 0, w : 0};
    isFire : boolean = false;
    last_tick : number = 0;
    isDead : boolean = false;
    isImmutable : number = 0;
    constructor(id : string, sessionId : string, gun_id : number = 1 ,name : string = "quoc")
    {   
        this.name = name;
        this.id = id;
        this.sessionId = sessionId; 
        this.gun_id = gun_id;
    }    

    Setup()
    {
        this.isFire  = false;
        this.last_tick  = 0;
        this.isDead = false;
        this.isImmutable = 0;
    }

    SetState(json : any)
    {
        if(!this.isDead)
        {
            this.velocity = json._event.velocity;
            this.rotation = json._event.rotation;
            this.position = json._event.position; 
            this.isFire = json._event.isFire;
        }
        else 
        {
            this.velocity = {x : 0, y : 0, z : 0};
        }
        if(this.isImmutable > 0) return;
        this.isDead = json._event.isDead; 
    }
}  

export default Player;