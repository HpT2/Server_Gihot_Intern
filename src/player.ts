
class Player{

    name : string;
    sessionId : string;
    id : string;
    gun_id : number = 0;
    in_room : boolean = false;
    position : any = {x : 0, y : 0, z : 0};
    velocity : any = {x : 0, y : 0, z : 0};
    rotation : any = {x : 0, y : 0, z : 0, w : 0};
    isColliding : boolean = false;
    isFire : boolean = true;
    last_tick : number = 0;
    isActive : boolean = true;
    constructor(id : string, sessionId : string, gun_id : number = 1 ,name : string = "quoc")
    {   
        this.name = name;
        this.id = id;
        this.sessionId = sessionId; 
        this.gun_id = gun_id;
    }    

}  

export default Player;