import { GetRandom } from "./function";
import PowerUp from "./power_up";
import rooms from "../start_server2";
import Game from "./game";

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
    roomInfosForSpawnCreep: Map<string, {
        timeStart: number;
        creeps_manage: boolean[]; 
        timeOutList: {
            startTime: number;
            timeRemain: number;
            timeOut: ReturnType<typeof setTimeout>;
            creepId: number;
        }[];
    }>;
    private static instance: Creep;

    private constructor()
    {   
        this.creepsToSpawn = [
            new CreepSpawnInfo(0,2000,5000,4),
            new CreepSpawnInfo(20000,3000,7000,3),
            new CreepSpawnInfo(45000,5000,10000,3),
            new CreepSpawnInfo(90000,5000,10000,3),
            new CreepSpawnInfo(10000,7000,15000,3),
            new CreepSpawnInfo(10000,15000,25000,1),
            new CreepSpawnInfo(10000,20000,30000,1)
        ]

        this.roomInfosForSpawnCreep = new Map<string, {
            timeStart: number;
            creeps_manage: boolean[];
            timeOutList: {
                startTime: number;
                timeRemain: number;
                timeOut: ReturnType<typeof setTimeout>;
                creepId: number;
            }[];
        }>;
    }  
    
    public static getInstance(): Creep {
        if (!Creep.instance) {
          Creep.instance = new Creep();
        }
        return Creep.instance;
    }

    public OnGameStart(room_id: string) {
        this.roomInfosForSpawnCreep.set(room_id, {
            timeStart: Date.now(),
            creeps_manage: [],
            timeOutList: []
        })
    }

    public OnGamePause(room_id: string) {
        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        if (roomInfoForSpawnCreep == undefined) return;

        roomInfoForSpawnCreep.timeOutList.forEach(timeOut => {
            timeOut.timeRemain -= Date.now() - timeOut.startTime;
            clearTimeout(timeOut.timeOut);
        });
    }

    public OnGameResume(room_id: string) {
        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        if (roomInfoForSpawnCreep == undefined) return;

        roomInfoForSpawnCreep.timeOutList.forEach(timeOut => {
            if (timeOut.timeRemain > 0) {     
                timeOut.timeOut = setTimeout(() => { this.SpawnCreepByIdRepeat(timeOut.creepId, room_id) }, timeOut.timeRemain);
                timeOut.startTime = Date.now();
            }
        });
    }

    public OnGameEnd(room_id: string) {
        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        if (roomInfoForSpawnCreep == undefined) return;

        roomInfoForSpawnCreep.timeOutList.forEach(timeOut => {
            if (timeOut) {
                clearTimeout(timeOut.timeOut);
            }
        });

        this.roomInfosForSpawnCreep.delete(room_id);
    } 

    private SpawnCreepByIdRepeat(id: number, room_id: string): void {
        console.log("spawn" + id); 

        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        
        if (roomInfoForSpawnCreep == undefined) return;

        const game_state = rooms.get(room_id)?.game?.gameState;
        
        if(!game_state) return;

        if (!game_state.creep_spawn_infos) {
            game_state.creep_spawn_infos = [];
        }

        for (let i = 0; i < this.creepsToSpawn[id].spawnRate; i++) {
            roomInfoForSpawnCreep.creeps_manage.push(true);
            game_state.creep_spawn_infos.push({
                type_int: id, 
                spawn_pos: {
                    x: GetRandom(30, 120),
                    y: 0,
                    z: GetRandom(-120, 60)
                },
                time: Date.now() - roomInfoForSpawnCreep.timeStart,
                shared_id: roomInfoForSpawnCreep.creeps_manage.length - 1
            });
        }

        const randomDelay = GetRandom(this.creepsToSpawn[id].minSpawnIntervalTime, this.creepsToSpawn[id].maxSpawnIntervalTime); 
        const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => { this.SpawnCreepByIdRepeat(id, room_id) }, randomDelay);
        roomInfoForSpawnCreep.timeOutList.push({
            startTime: Date.now(),
            timeRemain: randomDelay,
            timeOut: timeoutId,
            creepId: id
        });
    }

    public StartSpawnProcess(room_id: string) {
        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        if (roomInfoForSpawnCreep == undefined) return;
        
        for (let i = 0; i < this.creepsToSpawn.length; i++) {
            const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
                this.SpawnCreepByIdRepeat(i, room_id)
            }, this.creepsToSpawn[i].startSpawnTime); 
            roomInfoForSpawnCreep.timeOutList.push({
                startTime: Date.now(),
                timeRemain: this.creepsToSpawn[i].startSpawnTime,
                timeOut: timeoutId,
                creepId: i
            })
        }
    }

    public DestroyCreep(shared_id : number, power_up_spawn_info: {type_int: number, spawn_pos: {x: number, y: number, z: number}} | null, room_id : string, game : Game) {
        const roomInfoForSpawnCreep = this.roomInfosForSpawnCreep.get(room_id);
        //console.log("creep destroyed: "+shared_id);
        if (roomInfoForSpawnCreep == undefined) return;

        if (roomInfoForSpawnCreep.creeps_manage[shared_id] == false) return;

        const game_state = game.gameState;
        game.UpdateEnemyKilled();

        if (!game_state.creep_destroy_infos) {
            game_state.creep_destroy_infos = [];
        }
        game_state.creep_destroy_infos.push({
            shared_id : shared_id, 
            power_up_spawn_info: PowerUp.getInstance().SpawnPowerUp(power_up_spawn_info, room_id)
        });

        roomInfoForSpawnCreep.creeps_manage[shared_id] = false;
    }
}

export default Creep;