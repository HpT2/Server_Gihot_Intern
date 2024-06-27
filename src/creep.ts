import { GetRandom } from "./function";
import * as dgram from 'dgram';

class CreepSpawnInfo {
    startSpawnTime: number;
    minSpawnIntervalTime: number;
    maxSpawnIntervalTime: number;
    spawnRate: number;

    constructor(startTime: number, minSpawnIntervalTime: number, maxSpawnIntervalTime: number, spawnRate: number) {
        this.startSpawnTime = startTime;
        this.minSpawnIntervalTime = minSpawnIntervalTime;
        this.maxSpawnIntervalTime = maxSpawnIntervalTime;
        this.spawnRate = spawnRate;
    }
}

class Creep{
    creepsToSpawn: CreepSpawnInfo[];
    roomTimeCounts: number[];
    roomKeepSpawns: boolean[];
    private static instance: Creep;

    private constructor()
    {   
        this.creepsToSpawn = [
            new CreepSpawnInfo(0,2,5,4),
            new CreepSpawnInfo(20,3,7,3),
            new CreepSpawnInfo(45,5,10,3),
            new CreepSpawnInfo(90,5,10,3),
            new CreepSpawnInfo(120,7,15,3),
            new CreepSpawnInfo(160,15,25,1),
            new CreepSpawnInfo(200,20,30,1)
        ]

        this.roomTimeCounts = [];

        this.roomKeepSpawns = [];
    }  
    
    public static getInstance(): Creep {
        if (!Creep.instance) {
          Creep.instance = new Creep();
        }
        return Creep.instance;
    }

    public OnRoomCreate() {
        //Mock
        
    }

    public OnRoomDestroy() {
        this.roomKeepSpawns.push(true);
        this.roomTimeCounts.push(Date.now());
    } 

    //Mock player
    public SpawnCreepByIdRepeat(id: number, roomId: number, server: dgram.Socket, port: number, address: string) {
        if (!this.roomKeepSpawns[roomId]) return;

        let sendData = {
            event_name : "spawn creep",
            creepTypeInt: id,
            spawnPos: {
                x: GetRandom(-38,38),
                y: 1.0,
                z: GetRandom(-38,38)
            },
            time: Date.now() - this.roomTimeCounts[roomId]
        }
        server.send(JSON.stringify(sendData), 0, JSON.stringify(sendData).length, port, address, () => {console.log(`Send to client ${address}:${port}: ${JSON.stringify(sendData)}`);})

        const randomDelay = GetRandom(this.creepsToSpawn[id].minSpawnIntervalTime, this.creepsToSpawn[id].maxSpawnIntervalTime); 
        setTimeout(() => { this.SpawnCreepByIdRepeat(id, roomId, server, port, address) }, randomDelay*1000);
    }

    //Mock player
    public StartSpawnProcess(roomId: number, server: dgram.Socket, port: number, address: string) {
        // this.roomKeepSpawns[roomId] = true;
        // this.roomTimeCounts[roomId] = Date.now();
        // for (let i = 0; i < this.creepsToSpawn.length; i++) {
        //     const initialDelay = GetRandom(this.creepsToSpawn[i].minSpawnIntervalTime, this.creepsToSpawn[i].maxSpawnIntervalTime);
        //     setTimeout(() => {
        //         this.SpawnCreepByIdRepeat(i, roomId, server, port, address)
        //     }, initialDelay);
        // }

        let sendData = {
            event_name : "spawn creep",
            creepTypeInt: 0,
            spawnPos: {
                x: GetRandom(-38,38),
                y: 1.0,
                z: GetRandom(-38,38)
            },
            time: Date.now() - this.roomTimeCounts[roomId]
        }
        server.send(JSON.stringify(sendData), 0, JSON.stringify(sendData).length, port, address, () => {console.log(`Send to client ${address}:${port}: ${JSON.stringify(sendData)}`);})
    }
}

export default Creep;