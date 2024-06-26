
class Player{

    name : string;
    address : string;
    port : number;
    id : string;
    constructor(id : string, address : string, port : number, name : string = "quoc")
    {   
        this.name = name;
        this.id = id;
        this.address = address;
        this.port = port;
    }    
}

export default Player;