import { Block, BlockCustomComponent, Dimension, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";
import { PrismInfoAdmin } from "./prism-info-fn";
import { PrismInfo } from "./crystal-biome";

const offset = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 }
] as const;

type n = number;
type Facing = Record<"dx" | "dz", n>;
type State = `${n}|${n}|${n}|${n}|${n}`;
type Check = typeof checkMap[keyof typeof checkMap] | "stop";
type RaidWaveInfo = string[][]
type RaidTag = `cb2:raid_by_${n}/${n}/${n}`;

const raidTag = (location: Vector3): RaidTag => `cb2:raid_by_${location.x}/${location.y}/${location.z}`;

const checkMap = {
    "minecraft:air": "none",
    "cb2:reflection_left_block": "left",
    "cb2:reflection_right_block": "right",
    "cb2:resonance_node_block": "energy",
    "cb2:clear_crystal_block": "split"
} as const;

class Raycast {
    location: Vector3;
    facing: Facing;
    step: number = 0;
    record: Set<string>;
    particle: boolean = true;
    constructor(loc: Vector3, facing: Facing, record: Set<string>) {
        this.location = loc;
        this.facing = facing;
        this.record = record;
    }
    get #state(): State {
        return `${this.location.x}|${this.location.y}|${this.location.z}|${this.facing.dx}|${this.facing.dz}`;
    }
    #recordCheck(state: State): boolean {
        if (this.record.has(state)) return true;
        this.record.add(state);
        return false;
    }

    #blockCheck(typeId: string | undefined): Check {
        if (
            typeId === undefined ||
            !(typeId in checkMap)
        ) return "stop";
        return checkMap[typeId as keyof typeof checkMap];
    }

    #getDirect(get: "left" | "right"): Facing {
        const { dx, dz } = this.facing;
        return get === "left"
            ? { dx: dz, dz: -dx }
            : { dx: -dz, dz: dx };
    }
    async forward(dimension: Dimension) {
        for (let i = 0; i < 8; i++) {
            if (this.#recordCheck(this.#state)) break;
            const block = dimension.getBlock(this.location);
            const check = this.#blockCheck(block?.typeId);
            if (check === "stop") break;
            else if (check === "left" || check === "right") {
                const { x, y, z } = block!.center();
                const direct: Facing = this.#getDirect(check);
                const { dx, dz } = direct;
                const ray = new Raycast({ x: x + dx, y: y, z: z + dz }, direct, this.record);
                ray.forward(dimension);
                dimension.playSound("random.pop", { x: x, y: y, z: z }, { "pitch": 3 });
                break;
            } else if (check === "split") {
                const { x, y, z } = block!.center();
                const directLeft: Facing = this.#getDirect("left");
                const directRight: Facing = this.#getDirect("right");
                const leftRay = new Raycast({ x: x + directLeft.dx, y: y, z: z + directLeft.dz }, directLeft, this.record);
                const rightay = new Raycast({ x: x + directRight.dx, y: y, z: z + directRight.dz }, directRight, this.record);
                leftRay.forward(dimension);
                rightay.forward(dimension);
                break;
            } else if (check === "energy") {
                block?.setPermutation(block.permutation.withState("cb2:bool_I" as any, true));
                block?.setPermutation(block.permutation.withState("cb2:energy" as any, 8));
                break;
            }
            dimension.spawnParticle(
                "cb2:prismstone_line_particle",
                this.location
            );
            const isX = this.facing.dx !== 0;
            if (isX) this.location.x += this.facing.dx;
            else this.location.z += this.facing.dz;

            if (i % 2 === 0) await sleep(1);
        }

    }
}

const waveMap: Record<PrismInfo["raid"]["enter"], RaidWaveInfo> = {
    "none": [[]],
    "small_raid": [[""]],
    "medium_raid": [[""]],
    "mega_raid_executor": [
        ["cb2:crystal_guard", "cb2:crystal_guard", "cb2:crystal_guard", "cb2:crystal_guard"]
    ],
    "mega_raid_wanderment": [[""]],
}
const waveSpawn = (dimension: Dimension, location: Vector3, list: RaidWaveInfo, currWave: number) => {
    const waveList: string[] = list[currWave - 1];
    const tag: RaidTag = raidTag(location);
    console.log(waveList)
    for (const data of waveList) {
        dimension.spawnEntity(data, location).addTag(tag);
    }
}

const radiationPrism = (dimension: Dimension, block: Block) => {
    const { x, y, z } = block.center();
    for (const { dx, dz } of offset) {
        const ray = new Raycast({ x: x + dx, y: y, z: z + dz }, { dx: dx, dz: dz }, new Set());
        ray.forward(dimension);
    }
}
const raidOnPrism = (dimension: Dimension, block: Block) => {
    const prismInfo = new PrismInfoAdmin(world);
    const raid = prismInfo.info.raid;

    if (!prismInfo.hasQueue() && !prismInfo.isRaid()) return;

    if (prismInfo.hasQueue()) {
        if (!prismInfo.applyRaid()) return;
        raid.enter = "none";
    }

    if (raid.currWave === 0) {
        raid.currWave = 1;
        dimension.setBlockType(block.above()?.location!, "cb2:boss_frame");
        prismInfo.apply(world);
        console.log("Wave 1 開始: フレーム設置");
        return;
    }

    const isFrameBroken = block.above()?.typeId === "minecraft:air";

    if (isFrameBroken) {
        raid.currWave++;
        
        if (raid.currWave > 3) {
            console.log("おわり: 襲撃クリア");
            prismInfo.setValue("raid", {
                enter: "none",
                progress: "none",
                currWave: 0,
                firstOfWave: false
            });
            prismInfo.apply(world);
            return;
        }

        dimension.setBlockType(block.above()?.location!, "cb2:boss_frame");
        waveSpawn(dimension, block.center(), listtt, 1);
        prismInfo.apply(world);
        console.log(`Wave ${raid.currWave}`);
        return;
    }
};

export const PrismStone: BlockCustomComponent = {
    onPlace({ dimension, block }) {
        radiationPrism(dimension, block)
    },
    onTick({ dimension, block }) {
        radiationPrism(dimension, block);
        raidOnPrism(dimension, block);
    }
}