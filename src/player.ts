
class Player{

    name : string;
    sessionId : string;
    id : string;
    gun_id : number = 0;
    in_room : boolean = false;
    constructor(id : string, sessionId : string, gun_id : number = 1 ,name : string = "quoc")
    {   
        this.name = name;
        this.id = id;
        this.sessionId = sessionId; 
        this.gun_id = gun_id;
    }    

}  

export default Player;