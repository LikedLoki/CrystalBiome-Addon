import { Entity, Vector3 } from "@minecraft/server";


export type GuardWonderId = "cb2:crystal_guard" | "cb2:crystal_wander";
export type GuardWonderEntity = Entity & { "typeId": GuardWonderEntity };
export type CrystColor = "red" | "green" | "blue" | "yellow";
export type CrystRGB = { "red": number, "green": number, "blue": number };
export type VectorDXYZ = { "dx": number, "dy": number, "dz": number };
export type LocName = `${string}|${string}|${string}`;
export type PrismInfo = {
    "stop": boolean,
    "stop_time": number,
    "location": Vector3,
    "center": Vector3,
    "state": 0 | 1 | 2; // 0: none, 1: placed(broken), 2: placed(default)
    "raid": {
        "enter": "small_raid" | "medium_raid" | "mega_raid_executor" | "mega_raid_wanderment" | "none",
        "progress": "small_raid" | "medium_raid" | "mega_raid_executor" | "mega_raid_wanderment" | "none",
        "raidState": "begin" | "wait" | "next" | "next_group" | "win" | "lose" | "none";
        "currWave": number;
        "currGroup": number;
        "groupTimer": number;
        "firstOfWave": boolean;
        "attacked": number;
    }
}