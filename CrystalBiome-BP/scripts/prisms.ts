import { Block, BlockCustomComponent, Container, Dimension, Entity, ItemStack, MolangVariableMap, Player, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";
import { PrismInfoAdmin } from "./prism-info-fn";
import { PrismInfo } from "./crystal-biome";

let var1: MolangVariableMap;
system.run(() => var1 = new MolangVariableMap())

const offset = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 }
] as const;

type n = number;
type Facing = { dx: number; dy: number; dz: number };
type State = `${n}|${n}|${n}|${n}|${n}|${n}`;
type Check = typeof checkMap[keyof typeof checkMap] | "stop";
type RaidWaveInfo = string[][][]
type RaidTag = `cb2:raid_by_${n}/${n}/${n}`;

const raidTag = (location: Vector3): RaidTag => `cb2:raid_by_${location.x}/${location.y}/${location.z}`;

const checkMap = {
    "minecraft:air": "none",
    "cb2:reflection_left_block": "left",
    "cb2:reflection_right_block": "right",
    "cb2:reflection_up_block": "up",
    "cb2:reflection_down_block": "down",
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
        return `${this.location.x}|${this.location.y}|${this.location.z}|${this.facing.dx}|${this.facing.dy}|${this.facing.dz}`;
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

    #getDirect(direction: "left" | "right" | "up" | "down"): Facing {
        const { dx, dy, dz } = this.facing;
        if (direction === "left") return { dx: dz, dy: 0, dz: -dx };
        if (direction === "right") return { dx: -dz, dy: 0, dz: dx };
        if (direction === "up") return { dx: 0, dy: 1, dz: 0 };
        if (direction === "down") return { dx: 0, dy: -1, dz: 0 };
        return this.facing;
    }
    async forward(dimension: Dimension) {
        for (let i = 0; i < 8; i++) {
            if (this.#recordCheck(this.#state)) break;
            const block = dimension.getBlock(this.location);
            const check = this.#blockCheck(block?.typeId);
            if (check === "stop") break;
            else if (check === "left" || check === "right" || check === "up" || check === "down") {
                const { x, y, z } = block!.center();
                const direct: Facing = this.#getDirect(check);
                const { dx, dy, dz } = direct;
                const ray = new Raycast({ x: x + dx, y: y + dy, z: z + dz }, direct, this.record);
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
                block?.setPermutation(block.permutation.withState("cb2:energy" as any, 4));
                break;
            }
            dimension.spawnParticle(
                "cb2:prismstone_line_particle",
                this.location
            );
            this.location.x += this.facing.dx;
    this.location.y += this.facing.dy;
    this.location.z += this.facing.dz;

            if (i % 2 === 0) await sleep(1);
        }

    }
}

const E = (typeId: string, weight: number): { typeId: string, weight: number } => ({ typeId: typeId, weight: weight });

const randEnemy = (ids: { typeId: string, weight: number }[], amount: number) => {
    const result: string[] = [];
    for (let i = 0; i < amount; i++) {
        const total: number = ids.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * total;
        for (const item of ids) {
            if (random < item.weight) {
                result.push(item.typeId);
                break;
            }
            random -= item.weight;
        }
    }
    return result;
}

const waveMap: Record<PrismInfo["raid"]["enter"], RaidWaveInfo> = {
    "none": [[[]]],
    "small_raid": [[[]]],
    "medium_raid": [[[]]],
    "mega_raid_executor": [
        [
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 4),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 4),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 4),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 4),
        ],
        [
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 6),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4)], 6),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 2), E("cb2:crystal_mirage", 1)], 6),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 2), E("cb2:crystal_mirage", 1)], 6),
        ],
        [
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 4), E("cb2:crystal_mirage", 2)], 8),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 4), E("cb2:crystal_mirage", 2)], 8),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 4), E("cb2:crystal_mirage", 2)], 8),
            randEnemy([E("cb2:crystal_guard", 8), E("cb2:crystal_wander", 4), E("cb2:crystal_sentinel", 4), E("cb2:crystal_mirage", 2)], 8),
        ],
        [
            randEnemy([E("cb2:crystal_sentinel", 4), E("cb2:crystal_mirage", 2)], 32)
        ],
    ],
    "mega_raid_wanderment": [[[]]],
}
const searchY = (dimension: Dimension, location: Vector3): Vector3 => {
    const loc: Vector3 = { ...location }
    while (!dimension.getBlock({ x: loc.x, y: loc.y, z: loc.z })?.isAir) {
        loc.y++;
    }
    return loc
}
const waveSpawn = (dimension: Dimension, location: Vector3, list: RaidWaveInfo, currWave: number, currGroup: number) => {
    const waveList: string[][] = list[currWave - 1];
    const gropuList: string[] = waveList[currGroup - 1];
    const tag: RaidTag = raidTag(location);
    const r = 32;
    for (const data of gropuList) {
        const rand: number = Math.random() * 2 * Math.PI;
        const spawnLoc: Vector3 = searchY(dimension, {
            "x": location.x + r * Math.cos(rand),
            "y": location.y,
            "z": location.z + r * Math.sin(rand)
        })
        const A: Entity = dimension.spawnEntity(data as any, spawnLoc);
        A.addTag(tag);
        A.addTag("cb2:crystal_raid_enemy")
    }
}

const sendActionBar = (targets: Player[], text: string) => {
    for (const target of targets) target.runCommand(`title @s actionbar ${text}`);
}

const radiationPrism = (dimension: Dimension, block: Block) => {
    const { x, y, z } = block.center();
    for (const { dx, dz } of offset) {
        const ray = new Raycast({ x: x + dx, y: y, z: z + dz }, { dx: dx, dy: 0, dz: dz }, new Set());
        ray.forward(dimension);
    }
}
const raidOnPrism = async (dimension: Dimension, block: Block) => {
    const prismInfo = new PrismInfoAdmin(world);

    if (prismInfo.info.stop_time >= 8) {
        prismInfo.info.stop_time = 0;
        prismInfo.info.stop = false;
        prismInfo.apply(world);
    }
    if (prismInfo.info.stop) {
        prismInfo.info.stop_time++
        prismInfo.apply(world);
        return;
    }

    const loc: Vector3 = prismInfo.info.center ?? block.center();
    const nearPlayers = dimension.getPlayers({
        "maxDistance": 128,
        "location": loc
    });

    if (!prismInfo.hasQueue() && !prismInfo.isRaid()) return;

    //============================
    const GROUP_SPAWN_INTERVAL = 4;
    //============================

    let isDamagedThisTick = false;
    const enemies: Entity[] = dimension.getEntities({
        "tags": [raidTag(loc)]
    });

    if (prismInfo.hasQueue()) {
        prismInfo.runRaid()
        prismInfo.raid.enter = "none";
        prismInfo.raid.raidState = "begin";
    }
    else if (prismInfo.raid.currWave === 0) {
        prismInfo.raid.raidState = "begin";
    }
    else {
        const hasNearEnemy = dimension.getEntities({
            "location": loc,
            "maxDistance": 2,
            "tags": [raidTag(loc)]
        }).length !== 0;

        if (hasNearEnemy) {
            prismInfo.raid.attacked++;
            isDamagedThisTick = true;
        }

        const currentWaveData = waveMap[prismInfo.raid.progress]?.[prismInfo.raid.currWave - 1];
        const maxGroups = currentWaveData?.length ?? 0;
        const maxWaves = waveMap[prismInfo.raid.progress]?.length ?? 0;

        if (typeof prismInfo.raid.groupTimer !== "number" || isNaN(prismInfo.raid.groupTimer)) {
            prismInfo.raid.groupTimer = GROUP_SPAWN_INTERVAL;
        }

        if (prismInfo.raid.attacked >= 8) {
            prismInfo.raid.raidState = "lose";
        }
        else if (prismInfo.raid.currGroup < maxGroups && (prismInfo.raid.groupTimer <= 0 || enemies.length === 0)) {
            prismInfo.raid.raidState = "next_group";
        }
        else if (prismInfo.raid.currGroup >= maxGroups && enemies.length === 0) {
            const nextWave = prismInfo.raid.currWave + 1;
            if (nextWave > maxWaves) {
                prismInfo.raid.raidState = "win";
            } else {
                prismInfo.raid.raidState = "next";
            }
        }
        else {
            prismInfo.raid.raidState = "wait";
        }
    }

    // ==========================================
    // 2. raidState に基づいた実行フェーズ
    // ==========================================
    switch (prismInfo.raid.raidState) {
        case "begin": {
            prismInfo.toggleStop();
            prismInfo.apply(world);
            sendActionBar(nearPlayers, "§o-#-");
            await sleep(40);
            sendActionBar(nearPlayers, "§o-$-");
            await sleep(40);
            sendActionBar(nearPlayers, "§o-%-");
            await sleep(40);
            sendActionBar(nearPlayers, "§o-&-");
            await sleep(40);
            sendActionBar(nearPlayers, "§o---");
            await sleep(80);
            prismInfo.toggleStop();

            prismInfo.raid.currWave = 1;
            prismInfo.raid.currGroup = 1;
            prismInfo.raid.attacked = 0;
            prismInfo.raid.groupTimer = GROUP_SPAWN_INTERVAL;
            prismInfo.raid.raidState = "wait";

            var1.setColorRGB("variable.color", { "red": 1, "green": 0.2, "blue": 0.2 });
            dimension.spawnParticle("cb2:prismstone_react_particle", loc, var1);
            for (const { location } of nearPlayers) dimension.playSound("mace.smash_ground", location, { "pitch": 0.5 });

            waveSpawn(dimension, loc, waveMap[prismInfo.raid.progress], prismInfo.raid.currWave, prismInfo.raid.currGroup);

            sendActionBar(nearPlayers, `CURRENT: WAVE ${prismInfo.raid.currWave}`);

            prismInfo.apply(world);
            break;
        }

        case "next_group": {
            if (isDamagedThisTick) {
                sendActionBar(nearPlayers, `CURRENT: WAVE ${prismInfo.raid.currWave}\n${prismInfo.raid.attacked > 4 ? "§l" : ""}§cDAMAGED: ${prismInfo.raid.attacked}/8`);
                for (const { location } of nearPlayers) dimension.playSound("random.anvil_land", location);
            } else {
                prismInfo.raid.attacked = 0;
                sendActionBar(nearPlayers, `CURRENT: WAVE ${prismInfo.raid.currWave}`);
            }
            prismInfo.raid.currGroup++;
            prismInfo.raid.groupTimer = GROUP_SPAWN_INTERVAL; // タイマーリセット
            prismInfo.raid.raidState = "wait";

            waveSpawn(dimension, loc, waveMap[prismInfo.raid.progress], prismInfo.raid.currWave, prismInfo.raid.currGroup);
            prismInfo.apply(world);
            break;
        }

        case "wait": {
            prismInfo.raid.groupTimer--;

            if (isDamagedThisTick) {
                sendActionBar(nearPlayers, `CURRENT: WAVE ${prismInfo.raid.currWave}\n${prismInfo.raid.attacked > 4 ? "§l" : ""}§cDAMAGED: ${prismInfo.raid.attacked}/8`);
                for (const { location } of nearPlayers) dimension.playSound("random.anvil_land", location);
            } else {
                prismInfo.raid.attacked = 0;
                sendActionBar(nearPlayers, `CURRENT: WAVE ${prismInfo.raid.currWave}`);
            }
            // タイマーが減った状態を確実に保存
            prismInfo.apply(world);
            break;
        }

        case "next": {
            prismInfo.raid.attacked = 0;
            prismInfo.raid.currWave++;
            prismInfo.raid.currGroup = 1;
            prismInfo.raid.groupTimer = GROUP_SPAWN_INTERVAL;
            prismInfo.raid.raidState = "wait";

            sendActionBar(nearPlayers, `NEXT -> WAVE${prismInfo.raid.currWave}`);

            var1.setColorRGB("variable.color", { "red": 0.2, "green": 0.2, "blue": 1 });
            dimension.spawnParticle("cb2:prismstone_react_particle", loc, var1);
            for (const { location } of nearPlayers) dimension.playSound("mace.smash_ground", location, { "pitch": 1.5 });

            waveSpawn(dimension, loc, waveMap[prismInfo.raid.progress], prismInfo.raid.currWave, prismInfo.raid.currGroup);
            prismInfo.apply(world);
            break;
        }

        case "win": {
            sendActionBar(nearPlayers, "RAID-WIN");

            var1.setColorRGB("variable.color", { "red": 0.2, "green": 1, "blue": 0.2 });
            dimension.spawnParticle("cb2:prismstone_react_particle", loc, var1);
            dimension.spawnParticle("cb2:prismstone_react_particle", { x: loc.x + 4, y: loc.y, z: loc.z + 4 }, var1);
            dimension.spawnParticle("cb2:prismstone_react_particle", { x: loc.x - 4, y: loc.y, z: loc.z + 4 }, var1);
            dimension.spawnParticle("cb2:prismstone_react_particle", { x: loc.x + 4, y: loc.y, z: loc.z - 4 }, var1);
            dimension.spawnParticle("cb2:prismstone_react_particle", { x: loc.x - 4, y: loc.y, z: loc.z - 4 }, var1);
            for (const { location } of nearPlayers) dimension.playSound("random.totem", location, { "pitch": 1.5 });

            prismInfo.setValue("raid", {
                enter: "none",
                progress: "none",
                raidState: "none",
                currWave: 0,
                currGroup: 0,
                groupTimer: 0,
                firstOfWave: false,
                attacked: 0
            });
            prismInfo.apply(world);
            break;
        }

        case "lose": {
            sendActionBar(nearPlayers, "RAID-LOSE");
            var1.setColorRGB("variable.color", { "red": 1, "green": 0.2, "blue": 0.2 });
            dimension.spawnParticle("cb2:prismstone_lose_particle", loc, var1);
            prismInfo.setValue("raid", {
                enter: "none",
                progress: "none",
                raidState: "none",
                currWave: 0,
                currGroup: 0,
                groupTimer: 0,
                firstOfWave: false,
                attacked: 0
            });
            for (const { location } of nearPlayers) dimension.playSound("random.totem", location);
            for (const enm of enemies) enm.removeTag(raidTag(loc));
            prismInfo.apply(world);
            break;
        }
    }
};

export const PrismStone: BlockCustomComponent = {
    onPlace({ dimension, block }) {
        const prism = new PrismInfoAdmin(world);
        prism.setValue("center", block.center());
        prism.setValue("location", block.location);
        prism.apply(world);
        radiationPrism(dimension, block)
    },
    onBreak() {
        const prism = new PrismInfoAdmin(world);
        prism.setValue("center", undefined);
        prism.setValue("location", undefined);
        prism.apply(world);
    },
    onTick({ dimension, block }) {
        radiationPrism(dimension, block);
        raidOnPrism(dimension, block);
    }
};
export const RestorationPrism: BlockCustomComponent = {
    async onPlayerInteract({ dimension, block, player }) {
        if (!player) return;
        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || item.typeId !== "cb2:crystal_heart_shard") return;
        const nxtAmnt = item.amount - 1;
        if (nxtAmnt > 0) {
            item.amount--;
            container?.setItem(player.selectedSlotIndex, item);
        } else {
            container?.setItem(player.selectedSlotIndex, undefined);
        }
        block.setType("cb2:prismstone");
        dimension.spawnParticle("cb2:prismstone_startup_particle", block.center());
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 2 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 2 });
        await sleep(1);
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1.5 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1.5 });
        await sleep(1);
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1 });
    }
}