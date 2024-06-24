"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = __importDefault(require("./game"));
class Room {
    constructor(player) {
        this.firstPlayer = player;
        this.id = player.id;
        this.players = [this.firstPlayer];
        this.locked = false;
        this.game = null;
        this.AddListener(this.firstPlayer.socket);
    }
    Add(player) {
        if (this.locked)
            return false;
        this.players.push(player);
        this.Add(player.socket);
        return true;
    }
    AddListener(socket) {
        socket.on("event", (msg) => {
            console.log(msg);
        });
    }
    RemovePlayer(id) {
        let index = this.players.findIndex((player) => {
            return player.id == id;
        });
        this.players.splice(index);
    }
    DeleteRoom() {
        this.players = [];
    }
    StartGame() {
        //init game state
        this.game = new game_1.default(this.players, this);
        //this.game.Run();
        this.locked = true;
        //emit game started to all players
    }
    Done() {
        this.game = null;
        this.locked = false;
    }
}
exports.default = Room;
