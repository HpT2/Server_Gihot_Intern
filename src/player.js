"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor(socket) {
        this.socket = socket;
        this.id = socket.id;
    }
}
exports.default = Player;
