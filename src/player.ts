import * as net from 'net';

class Player{

    name : string = "quoc";
    socket : net.Socket;
    id : string;
    constructor(socket : net.Socket, id : string)
    {   
        this.socket = socket;
        this.id = id;
    }    
}

export default Player;