import { Dimension, Entity, MolangVariableMap, system, Vector3, World } from "@minecraft/server";

export type GuardWonderId = "cb2:crystal_guard" | "cb2:crystal_wander";
export type GuardWonderEntity = Entity & { "typeId": GuardWonderEntity };
export type CrystColor = "red" | "green" | "blue" | "yellow";
export type CrystRGB = { "red": number, "green": number, "blue": number };
export type CrystRank = "rough" | "polished" | "refined"
export type VectorDXYZ = { "dx": number, "dy": number, "dz": number };
export type LocName = `${string}|${string}|${string}`;
export type PrismInfo = {
    "stop": boolean,
    "stop_time": number,
    "location": Vector3 | undefined,
    "center": Vector3 | undefined,
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

export let particleColor: MolangVariableMap
system.run(() => particleColor = new MolangVariableMap())
export const Color = {
    red: { red: 1, green: 0.45, blue: 0.45 },
    green: { red: 0.2, green: 1, blue: 0.75 },
    blue: { red: 0.2, green: 1, blue: 1 },
    yellow: { red: 1, green: 1, blue: 0.4 },
    flare: { red: 1, green: 0.5, blue: 0 }
} as const;

class CrystalBiomeEvent {
    #listeners: Record<string, Function[]>
    constructor() {
        this.#listeners = {}
    }
    subscribe(eventName: string, callback: Function): boolean {
        if (!this.#listeners?.[eventName]) this.#listeners[eventName] = [];
        this.#listeners[eventName].push(callback);
        return true;
    }
    publish(eventName: string, event: any): boolean {
        if (!this.#listeners?.[eventName]) return false;
        for (const fn of this.#listeners[eventName]) fn(event);
        return true;
    }
}
export const crystalBiomeEvent = new CrystalBiomeEvent();

export const translateMap = {
    JA: {
        "cb2:rough_blue_crystal_sword": "粗い蒼水晶の剣",
        "cb2:rough_red_crystal_sword": "粗い紅水晶の剣",
        "cb2:rough_green_crystal_sword": "粗い翠水晶の剣",
        "cb2:rough_yellow_crystal_sword": "粗い黄水晶の剣",
        "cb2:polished_blue_crystal_sword": "磨かれた蒼水晶の剣",
        "cb2:polished_red_crystal_sword": "磨かれた紅水晶の剣",
        "cb2:polished_green_crystal_sword": "磨かれた翠水晶の剣",
        "cb2:polished_yellow_crystal_sword": "磨かれた黄水晶の剣",
        "cb2:refined_blue_crystal_sword": "研磨された蒼水晶の剣",
        "cb2:refined_red_crystal_sword": "研磨された紅水晶の剣",
        "cb2:refined_green_crystal_sword": "研磨された翠水晶の剣",
        "cb2:refined_yellow_crystal_sword": "研磨された黄水晶の剣"
    }
} as const;

export class WorldPropertiesAdmin {
    #world: World;
    #targetId: string
    constructor(world: World, targetId: string) {
        this.#world = world;
        this.#targetId = targetId
    }
    getValue(parse?: boolean) {
        return parse ? JSON.parse(this.#world.getDynamicProperty(this.#targetId) as string) : this.#world.getDynamicProperty(this.#targetId);
    }
    setValue(value: any) {
        const type = typeof value;
        const necessaryJSON: boolean = type !== "string"
            && type !== "number"
            && type !== "boolean"
            && !(type === "object" && value.x !== undefined && value.y !== undefined && value.z !== undefined);

        if (necessaryJSON) {
            this.#world.setDynamicProperty(this.#targetId, JSON.stringify(value));
        } else {
            this.#world.setDynamicProperty(this.#targetId, value);
        }
    }
}