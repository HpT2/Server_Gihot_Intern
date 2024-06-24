"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Game {
    constructor(players, room) {
        this.players = players;
        this.room = room;
    }
    Run() {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].socket.on("event", (data) => {
                console.log(data);
            });
        }
    }
    EmitToAllPlayer(event, data) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].socket.emit(event, data);
        }
    }
    Done() {
        //emit end event to all players
        //unlock room and delete current match
        this.room.Done();
    }
}
exports.default = Game;
