import rooms from "../start_server2";

class PowerUp{
    static Power_Up_Time_To_Live: number = 15000;

    room_infos_for_manage_power_up: Map<string, boolean[]>;

    private static instance: PowerUp;

    private constructor() {
        this.room_infos_for_manage_power_up = new Map<string, boolean[]>();
    }  
    
    public static getInstance(): PowerUp {
        if (!PowerUp.instance) {
          PowerUp.instance = new PowerUp();
        }
        return PowerUp.instance;
    }

    public OnGameStart(room_id: string) {
        this.room_infos_for_manage_power_up.set(room_id, []);
    }

    public OnGameEnd(room_id: string) {
        this.room_infos_for_manage_power_up.delete(room_id);
    }

    public SpawnPowerUp(power_up_spawn_info: {type_int: number, spawn_pos: {x: number, y: number, z: number}} | null, room_id: string): {type_int: number, spawn_pos: {x: number, y: number, z: number}, shared_id: number} | null {
        if (power_up_spawn_info == null) return null;

        const room_info_for_manage_power_up = this.room_infos_for_manage_power_up.get(room_id);
        if (room_info_for_manage_power_up == undefined) return null;

        const idx = room_info_for_manage_power_up.push(true) - 1; 

        setTimeout(() => {
            room_info_for_manage_power_up[idx] = false;
        }, PowerUp.Power_Up_Time_To_Live)

        return {
            ...power_up_spawn_info, 
            shared_id: idx
        };
    }

    public PlayerPickUpPowerUp(shared_id: number, player_id: string, room_id: string) {
        const room_info_for_manage_power_up = this.room_infos_for_manage_power_up.get(room_id);
        if (room_info_for_manage_power_up == undefined) return;

        if (room_info_for_manage_power_up[shared_id] == false) return;

        room_info_for_manage_power_up[shared_id] = false;
        
        const game_state = rooms.get(room_id)?.game?.gameState;

        if (!game_state.power_up_pick_infos) {
            game_state.power_up_pick_infos = [];
        }
        game_state.power_up_pick_infos.push({
            player_id: player_id,
            shared_id: shared_id
        });
    }
}

export default PowerUp;