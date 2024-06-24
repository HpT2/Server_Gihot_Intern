import { Socket } from "socket.io";


class Player{

    socket : any;
    id : string;
    constructor(socket : Socket)
    {   
        this.socket = socket;
        this.id = socket.id;
    }    
}

export default Player;