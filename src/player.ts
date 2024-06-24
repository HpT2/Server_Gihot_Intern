import * as net from 'net';

class Player{

    socket : net.Socket;
    id : string;
    constructor(socket : net.Socket, id : string)
    {   
        this.socket = socket;
        this.id = id;
    }    
}

export default Player;