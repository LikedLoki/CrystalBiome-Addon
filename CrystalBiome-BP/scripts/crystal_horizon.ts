import { BlockVolume, CameraShakeType, Dimension, EasingType, Entity, EntityDieAfterEvent, EntityHurtAfterEvent, InputPermissionCategory, ItemStack, Player, system, TicksPerDay, TimeOfDay, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";
import { Color, CrystColor, particleColor, WorldPropertiesAdmin } from "./crystal-biome";
import { crystalSpawnFn } from "./crystal-spawn-fn";
import { crystalKingPhase1 } from "./crystal_king";



system.beforeEvents.startup.subscribe(({ dimensionRegistry }) => {
    dimensionRegistry.registerCustomDimension("cb2:crystal_horizon")
})

export class CrystlHrznGenerator {
    dimension: Dimension;
    startLocation: Vector3;
    facing: Vector3;
    count: number;
    branch: boolean;
    constructor(dimension: Dimension, startLocation: Vector3, facing: Vector3, count: number, branch: boolean) {
        this.dimension = dimension;
        this.startLocation = startLocation
        this.facing = facing;
        this.count = count;
        this.branch = branch;
    }
    async run(typeId: string) {
        for (let i = 0; i < this.count; i++) {
            const multiplier = i * 9;
            const { x, y, z } = this.startLocation;
            const base_0: Vector3 = { x: this.facing.x * multiplier, y: 0, z: this.facing.z * multiplier }
            let base_1: Vector3 = { x: x + -4 + base_0.x, y: y + -9, z: z + -4 + base_0.z };
            let base_2: Vector3 = { x: x + 4 + base_0.x, y: y + -1, z: z + 4 + base_0.z };
            world.tickingAreaManager.createTickingArea(`cb2:${JSON.stringify(this)}`, {
                dimension: this.dimension,
                from: base_1,
                to: base_2
            })
            await sleep(10)
            if (typeId !== "rand") this.dimension.fillBlocks(new BlockVolume(base_1, base_2), typeId);
            else {
                const selectedType = ["cb2:clear_crystal_block", "cb2:clear_red_crystal_block", "cb2:clear_green_crystal_block", "cb2:clear_yellow_crystal_block"][Math.random() * 4 | 0];
                this.dimension.fillBlocks(new BlockVolume(base_1, base_2), selectedType);
            }
            world.tickingAreaManager.removeTickingArea(`cb2:${JSON.stringify(this)}`)
            if (!this.branch) continue;
            const length = i > this.count / 2 ? this.count / 2 - (i - this.count / 2) : i;
            const leftBranch = new CrystlHrznGenerator(this.dimension, { x: x + base_0.x, y: y, z: z + base_0.z }, { x: -this.facing.z, y: 0, z: this.facing.x }, length, false);
            const rightBranch = new CrystlHrznGenerator(this.dimension, { x: x + base_0.x, y: y, z: z + base_0.z }, { x: this.facing.z, y: 0, z: -this.facing.x }, length, false);
            leftBranch.run(typeId)
            rightBranch.run(typeId)
        }
    }
}

export const CrystHrznAdmin = (dimension: Dimension, length: number, typeId: string) => {
    const trunk_1 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, length, true);
    trunk_1.run(typeId);
    const trunk_2 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, length, true);
    trunk_2.run(typeId);
    const trunk_3 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, length, true);
    trunk_3.run(typeId);
    const trunk_4 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, length, true);
    trunk_4.run(typeId);
    const trunk_5 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, length, false);
    trunk_5.run(typeId);
    const trunk_6 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 1 }, length, false);
    trunk_6.run(typeId);
    const trunk_7 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: -1 }, length, false);
    trunk_7.run(typeId);
    const trunk_8 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: -1 }, length, false);
    trunk_8.run(typeId);
};

// コールバックに渡すコンテキスト情報
export interface StructureGenerateContext {
    /** ワールド上の絶対座標 */
    location: Vector3;
    /** 生成部位タイプ */
    type: "main" | "top" | "bottom";
    /** 上に隣接する構造物が存在するか（falseなら上は空気/開放空間） */
    hasAbove: boolean;
    /** 下に隣接する構造物が存在するか（falseなら下は空気/開放空間） */
    hasBelow: boolean;
}

export type OnGenerateCallback = (context: StructureGenerateContext) => void | Promise<void>;

export class KingCastleGenerator {
    dimension: Dimension;
    location: Vector3;
    point: Vector3;

    onGenerate?: OnGenerateCallback;

    // 固定パラメーター
    private static readonly RADIUS = 2;
    private static readonly CUBIC_SIZE = 9;
    private static readonly OVERLAP = 1;
    private static readonly STEP = KingCastleGenerator.CUBIC_SIZE - KingCastleGenerator.OVERLAP; // 8

    constructor(dimension: Dimension, location: Vector3, onGenerate?: OnGenerateCallback) {
        this.dimension = dimension;
        this.location = location;
        this.point = { x: 0, y: 0, z: 0 };
        this.onGenerate = onGenerate;
    }

    private async executeGenerate(
        id: string,
        type: "main" | "top" | "bottom",
        hasAbove: boolean,
        hasBelow: boolean
    ) {
        const { x, y, z } = this.location;
        const { x: dx, y: dy, z: dz } = this.point;

        const targetLocation: Vector3 = {
            x: x + dx,
            y: y + dy,
            z: z + dz
        };

        this.dimension.runCommand(`structure load ${id} ${targetLocation.x} ${targetLocation.y} ${targetLocation.z}`);

        if (this.onGenerate) {
            await this.onGenerate({
                location: targetLocation,
                type,
                hasAbove,
                hasBelow
            });
        }
    }

    /**
     * 指定した相対グリッド座標 (dx, dy, dz) に構造体が存在するか判定
     */
    private hasBlockAt(dx: number, dy: number, dz: number, hasTop: boolean, hasBottom: boolean): boolean {
        const radius = KingCastleGenerator.RADIUS;

        // 1. 最頂部（topId）の位置チェック
        if (hasTop && dx === 0 && dy === radius + 1 && dz === 0) {
            return true;
        }

        // 2. 最底部（bottomId）の位置チェック
        if (hasBottom && dx === 0 && dy === -(radius + 1) && dz === 0) {
            return true;
        }

        // 3. ダイヤ本体の位置チェック（マンハッタン距離が radius 以下）
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) <= radius) {
            return true;
        }

        return false;
    }

    /**
     * 底面を基準とし、下から上に向かって順番に構造物を組み立てる
     */
    async buildDiamond(
        mainId: string,
        delayTicks: number = 2,
        topId?: string,
        bottomId?: string,
        onGenerateCallback?: OnGenerateCallback
    ) {
        const originalCallback = this.onGenerate;
        if (onGenerateCallback) {
            this.onGenerate = onGenerateCallback;
        }

        const radius = KingCastleGenerator.RADIUS;
        const step = KingCastleGenerator.STEP;

        const hasTop = Boolean(topId);
        const hasBottom = Boolean(bottomId);

        let currentYLayer = 0;

        // 1. 一番下の追加生成 (bottomId)
        if (bottomId) {
            const dy = -(radius + 1);
            const hasAbove = this.hasBlockAt(0, dy + 1, 0, hasTop, hasBottom);
            const hasBelow = false;

            this.point = { x: 0, y: currentYLayer * step, z: 0 };
            await this.executeGenerate(bottomId, "bottom", hasAbove, hasBelow);
            await sleep(delayTicks);
            currentYLayer++;
        }

        // 2. ダイヤ本体の生成
        const baseLayer = currentYLayer;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {

                    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) <= radius) {
                        const relativeY = baseLayer + (dy + radius);

                        const hasAbove = this.hasBlockAt(dx, dy + 1, dz, hasTop, hasBottom);
                        const hasBelow = this.hasBlockAt(dx, dy - 1, dz, hasTop, hasBottom);

                        this.point = {
                            x: dx * step,
                            y: relativeY * step,
                            z: dz * step
                        };

                        await this.executeGenerate(mainId, "main", hasAbove, hasBelow);
                        await sleep(delayTicks);
                    }
                }
            }
        }

        // 3. 一番上の追加生成 (topId)
        if (topId) {
            const dy = radius + 1;
            const hasAbove = false;
            const hasBelow = this.hasBlockAt(0, dy - 1, 0, hasTop, hasBottom);

            const topYLayer = baseLayer + (radius * 2 + 1);
            this.point = { x: 0, y: topYLayer * step, z: 0 };
            await this.executeGenerate(topId, "top", hasAbove, hasBelow);
            await sleep(delayTicks);
        }

        this.onGenerate = originalCallback;
    }
}

export const CrystalHorizonResetFn = async (color: string) => {
    const dimension = world.getDimension("cb2:crystal_horizon");
    const volumeI = new BlockVolume(
        { x: 21, y: 0, z: -54 },
        { x: -21, y: 0, z: -12 }
    );
    const volumeII = new BlockVolume(
        { x: 21, y: -1, z: -54 },
        { x: -21, y: -9, z: -12 }
    );
    const n = 16;
    for (let i = 1; i <= n; i++) {
        const one = i * (160 / n);
        const { x: tx, y: ty, z: tz } = volumeI.to;
        const { x: fx, y: fy, z: fz } = volumeI.from;
        await sleep(1);
        const volume = new BlockVolume({ x: fx, y: fy + one - (160 / n), z: fz }, { x: tx, y: ty + one, z: tz });
        dimension.fillBlocks(volume, "minecraft:air", { "blockFilter": { "includeTypes": ["cb2:fieldbarrier"] } })
        const centerLocation: Vector3 = { x: (fx + tx) / 2, y: (fy + ty) / 2, z: (fz + tz) / 2 };
        dimension.spawnParticle("cb2:crystaloak_planks_particle", centerLocation);
    }
    dimension.fillBlocks(volumeII, `cb2:clear_${color === "blue" ? "" : color + "_"}crystal_block`)
}


const tickStop = () => world.setDynamicProperty("cb2:ch_stop", true);
const tickStart = () => world.setDynamicProperty("cb2:ch_stop", false);
const orbspawnerSummonOffset = [
    { dx: 4, dz: 4 }, { dx: -4, dz: 4 }, { dx: 4, dz: -4 }, { dx: -4, dz: -4 }
] as const;
const crystKingStand = () => dimension.getEntities({ type: "cb2:crystal_king_stand" })[0];
const crystalKing = () => dimension.getEntities({ type: "cb2:crystal_king" })[0];
const crystalKingHealth = () => dimension.getEntities({ type: "cb2:crystal_king_health" })[0];
const animate = async (entity: Entity, id: string, time_s?: number) => {
    system.run(async () => {
        await sleep(1);
        time_s === undefined ? entity.playAnimation(id) : entity.playAnimation(id, { "blendOutTime": time_s })
    });
}
const centerLoc = (x: number, y: number, z: number): Vector3 => {
    return { x: x + 0.5, y: y + 0.5, z: z + 0.5 }
}

// AI産
function getDirection(a: Vector3, b: Vector3): Vector3 {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;

    const length = Math.hypot(dx, dy, dz);

    if (length === 0) {
        return { x: 0, y: 0, z: 0 };
    }

    return {
        x: dx / length,
        y: dy / length,
        z: dz / length,
    };
}

const shotPorjectile = (kingLocation: Vector3, playerLocation: Vector3) => {
    const { x, y, z } = kingLocation;
    const { x: dx, y: dy, z: dz } = getDirection(kingLocation, playerLocation);
    const projectle = dimension.spawnEntity("cb2:crystalshard_proj", { x: x + dx, y: y + dy, z: z + dz }, { "spawnEvent": `cb2:color_${["blue", "red", "green", "yellow"][Math.random() * 4 | 0]}` });
    projectle.applyImpulse({ x: dx, y: dy, z: dz });
}

const players = () => dimension.getPlayers();
const playerControl = (player: Player, enter: "enable" | "disable") => {
    if (enter === "enable") {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true)
    } else {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false)
    }
}

const kingChapter1 = async (dimension: Dimension, tick: number, stop: boolean) => {
    const targetLoc: Vector3 = { x: 0.5, y: 0, z: -24.5 };
    if (tick === 10) {
        world.tickingAreaManager.createTickingArea(`cb2:a`, {
            dimension: dimension,
            from: { x: 64, y: 64, z: 64 },
            to: { x: -64, y: -16, z: -64 }
        })
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 0.5, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 25) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -1), "facingLocation": centerLoc(0, 2, -2) });
            player.teleport(centerLoc(0, 1, 1));
        }
    } else if (tick === 40) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(1, 2, -18), "facingLocation": centerLoc(0, 1, -24), "easeOptions": { "easeTime": 3, "easeType": EasingType.InOutSine } });
        }
    } else if (tick === 80) {
        dimension.spawnParticle("cb2:crystal_king_spawn_particle", targetLoc);
        dimension.spawnEntity<"cb2:crystal_king_health">("cb2:crystal_king_health", { x: 0, y: 0, z: 0 });
        const crystalKingStand = dimension.spawnEntity<"cb2:crystal_king_stand">("cb2:crystal_king_stand", targetLoc);
        animate(crystalKingStand, "animation.crystal_king.idle", 1024);
    } else if (tick === 120) {
        const outLocation: Vector3 = { x: targetLoc.x, y: targetLoc.y + 16, z: targetLoc.z - 8 };
        const crystalKingStand = crystKingStand();
        dimension.spawnParticle("cb2:crystal_king_tp_particle", crystalKingStand.location);
        dimension.spawnParticle("cb2:crystal_king_tp_particle", outLocation);
        crystalKingStand.remove();
        dimension.spawnEntity<"cb2:crystal_king_stand">("cb2:crystal_king_stand", outLocation).addTag("facing");
        animate(crystKingStand(), "animation.crystal_king.to_fly", 1024);
        for (const player of players()) {
            player.playSound("mob.endermen.portal");
        }
    } else if (tick === 130) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(2, 4, -18), "facingLocation": centerLoc(0, 16, -32), "easeOptions": { "easeTime": 1, "easeType": EasingType.InOutSine } });
        }
    } else if (tick === 170) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 190) {
        for (const player of players()) {
            player.teleport(centerLoc(0, 0, -12))
            player.setRotation({ x: 45, y: 0 })
            player.camera.setCamera("minecraft:free", { "location": centerLoc(-8, 18, -36), "facingLocation": centerLoc(0, 1, -12) });
        }
    } else if (tick === 200) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(-8, 3, -8), "facingLocation": centerLoc(0, 16, -32), "easeOptions": { "easeTime": 3, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 220) {
        const crystalKingStand = crystKingStand()
        animate(crystalKingStand, "animation.crystal_king.to_battle");
    } else if (tick === 240) {
        const crystalKingStand = crystKingStand()
        for (const { dx, dz } of orbspawnerSummonOffset) {
            const { x, y, z } = crystalKingStand.location;
            const spawnLocation: Vector3 = { x: x + dx + Math.random() * 2, y: y, z: z + dz + Math.random() * 2 };
            dimension.spawnEntity<"cb2:orb_spawner">("cb2:orb_spawner", spawnLocation);
            particleColor.setColorRGB("variable.color", Color.blue);
            dimension.spawnParticle("cb2:cbspawn_particle", spawnLocation, particleColor);
        }
    } else if (tick === 255) {
        const crystalKingStand = crystKingStand()
        animate(crystalKingStand, "animation.crystal_king.to_fly", 1024);
    } else if (tick === 265) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(8, 3, -8), "facingLocation": centerLoc(0, 16, -32) });
            player.camera.setCamera("minecraft:free", { "location": centerLoc(8, 18, -36), "facingLocation": centerLoc(0, 1, -12), "easeOptions": { "easeTime": 3, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 330) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 18, -28), "facingLocation": centerLoc(0, 1, -12) });
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 1, -13), "facingLocation": centerLoc(0, 1, -12), "easeOptions": { "easeTime": 1 } });
        }
    } else if (tick === 350) {
        for (const player of players()) {
            player.camera.clear();
        }
    } else if (tick >= 350) {
        crystalKingPhase1(dimension, tick)
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
};

export const orbspawnerDie = ({ deadEntity }: EntityDieAfterEvent) => {
    if (deadEntity.typeId !== "cb2:orb_spawner") return;
    if (+(world.getDynamicProperty("cb2:ch_chapter") ?? 0) === 0) return;
    const guards = dimension.getEntities({ tags: [`cb2:orb_spawner_${deadEntity.id}`] });
    for (const guard of guards) guard.remove();
    const hpEntity = deadEntity.dimension.getEntities({ type: "cb2:crystal_king_health" })[0];
    hpEntity.applyDamage(30);
}

const kingChapter2 = (dimension: Dimension, tick: number, stop: boolean) => {
    if (tick === 0) {
        for (const player of players()) {
            player.camera.fade({ fadeTime: { fadeInTime: 0.5, holdTime: 1, fadeOutTime: 0.5 } });
        }
    } else if (tick === 20) {
        try { crystKingStand().remove() } catch (_) { };
        const crystalKingStand = dimension.spawnEntity("cb2:crystal_king_stand", centerLoc(0, 4, -32));
        animate(crystalKingStand, "animation.crystal_king.to_fly", 1024)
        for (const spawner of dimension.getEntities({ type: "cb2:orb_spawner" })) spawner.remove();
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 4, -20), "facingLocation": centerLoc(0, 4, -21) })
            player.teleport(centerLoc(0, 0, -12));
        }
    } else if (tick === 60) {
        for (const player of players()) {
            player.camera.addShake({ "intensity": 2, "duration": 1, "type": CameraShakeType.Positional })
            for (let i = 0; i < 4; i++) {
                (async () => {
                    await sleep(Math.random() * 4)
                    player.playSound("cbspawner_spawn")
                })()
            }
            player.camera.setCamera("minecraft:free", { "location": centerLoc(-21, 4, -12), "facingLocation": centerLoc(-4, 16, -29), "easeOptions": { "easeTime": 1, "easeType": EasingType.InOutSine } })
        }
        const A = new KingCastleGenerator(dimension, centerLoc(-3, 0, -36));
        let spawnAmount = 0;
        A.buildDiamond("king_castle_room", 2, "king_castle_end", "king_castle_start", ({ hasAbove, hasBelow, location }) => {
            const { dimension } = A;
            const { x, y, z } = location;
            if (hasBelow) {
                dimension.runCommand(`structure load king_castle_brknf ${x} ${y} ${z}`)
            }
            if (hasAbove) {
                dimension.runCommand(`structure load king_castle_brknf ${x} ${y + 8} ${z}`)
            }
            const spawnLocation: Vector3 = { x: x + 2, y: y + 1, z: z + 2 };
            const crystColor = ["blue", "red", "green", "yellow"] as CrystColor[]
            const randColor = () => Color[crystColor[Math.random() * 4 | 0]];
            if (Math.random() < 0.5) {
                spawnAmount++;
                const E = crystalSpawnFn(dimension, "cb2:crystal_guard", spawnLocation, randColor(), true, false);
                E.addTag("cb2:ch_guard");
                E.runCommand("replaceitem entity @s slot.armor.head 0 cb2:polished_green_crystal_helmet");
                E.runCommand("replaceitem entity @s slot.armor.chest 0 cb2:polished_blue_crystal_chestplate");
                E.runCommand("replaceitem entity @s slot.armor.legs 0 cb2:polished_red_crystal_leggings");
                E.runCommand("replaceitem entity @s slot.armor.feet 0 cb2:polished_yellow_crystal_boots");
            }
        })
        world.setDynamicProperty("cb2:ch_spawn_amount", spawnAmount);
        const crystalKingStand = crystKingStand();
        (async () => {
            const { x, y, z } = crystalKingStand.location;
            for (let i = 0; i < 48; i++) {
                await sleep(1);
                const outLocation: Vector3 = { x: x, y: y + i, z: z };
                crystalKingStand.teleport(outLocation);
            }
        })();
        for (let i = 0; i < 8; i++) {
            const blockId = `cb2:framed_${["", "red_", "green_", "yellow_"][Math.random() * 4 | 0]}crystal_block`;
            const { x, y, z } = centerLoc(0, 1, -33);
            const randomLocation = { x: x + Math.random() * 2, y: y, z: z + Math.random() * 2 }
            dimension.spawnItem(new ItemStack(blockId, 16), randomLocation)
        }
    } else if (tick === 120) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } })
        }
    } else if (tick === 140) {
        for (const player of players()) {
            player.camera.clear()
        }
    } else if (tick === 141) {
        if (!stop) tickStop();
        const crystalKingStand = crystKingStand();
        const arrivalPlayer = players().find(({ location: { x, y, z } }) => {
            const { x: tx, y: ty, z: tz } = crystalKingStand.location;
            return Math.sqrt((x - tx) ** 2 + (y - ty) ** 2 + (z - tz) ** 2) <= 8;
        })
        if (!arrivalPlayer) return;
        world.setDynamicProperty("cb2:ch_tick", 0)
        world.setDynamicProperty("cb2:ch_chapter", 3)
        tickStart();
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
const kingChapter3 = (dimension: Dimension, tick: number, stop: boolean) => {
    if (tick === 0) {
        for (const player of players()) {
            player.camera.fade({ fadeTime: { fadeInTime: 0.5, holdTime: 1, fadeOutTime: 0.5 } });
        }
    } else if (tick === 20) {
        for (const guard of dimension.getEntities({ tags: ["cb2:ch_guard"] })) guard.teleport(centerLoc(0, 0, 0));
        for (const player of players()) {
            player.teleport(centerLoc(0, 49, -30))
            player.camera.setCamera("minecraft:free", { "location": centerLoc(4, 54, -29), "facingEntity": crystKingStand() })
        }
    } else if (tick === 40) {
        animate(crystKingStand(), "animation.crystal_king.to_barrier");
    } else if (tick === 80) {
        const volumeI = new BlockVolume(
            { x: 21, y: 160, z: -54 },
            { x: 21, y: -9, z: -12 }
        );

        const volumeII = new BlockVolume(
            { x: 21, y: 160, z: -54 },
            { x: -21, y: -9, z: -54 }
        );

        const volumeIII = new BlockVolume(
            { x: -21, y: 160, z: -12 },
            { x: 21, y: -9, z: -12 }
        );

        const volumeIV = new BlockVolume(
            { x: -21, y: 160, z: -12 },
            { x: -21, y: -9, z: -54 }
        );
        dimension.fillBlocks(volumeI, "cb2:fieldbarrier")
        dimension.fillBlocks(volumeII, "cb2:fieldbarrier")
        dimension.fillBlocks(volumeIII, "cb2:fieldbarrier")
        dimension.fillBlocks(volumeIV, "cb2:fieldbarrier")
        crystKingStand().teleport(centerLoc(0, 41, -33));
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(2, 42, -31), "facingLocation": centerLoc(0, 42, -33), "easeOptions": { "easeType": EasingType.OutSine, "easeTime": 0.5 } })
            player.playSound("random.explode")
            player.camera.addShake({ "intensity": 2, "duration": 0.5, "type": CameraShakeType.Positional })
        }
        dimension.fillBlocks(new BlockVolume({ x: -2, y: 46, z: -31 }, { x: 2, y: 41, z: -35 }), "minecraft:air")
        world.setTimeOfDay(TimeOfDay.Night)
        dimension.spawnParticle("cb2:crystaloak_planks_particle", crystKingStand().location)
    } else if (tick === 120) {
        for (const player of players()) player.playSound("mob.endermen.portal");
        const crystalKingStand = crystKingStand();
        dimension.spawnParticle("cb2:crystal_king_tp_particle", crystalKingStand.location)
        crystalKingStand.remove();
        crystalKingHealth().remove();
        dimension.spawnEntity("cb2:crystal_king", centerLoc(0, 41, -41)).addTag("cb2:stop");
        const health = crystalKing().getComponent("minecraft:health");
        const A = dimension.getEntities({ tags: ["cb2:ch_guard"] }).length; // 残りガードの数
        const B = +(world.getDynamicProperty("cb2:ch_spawn_amount") || 0); // 召喚されたはずのガードの数
        const C = (health?.defaultValue ?? 0); // クリスタルキングの最大体力
        const D = B > 0
            ? C * (0.5 + 0.5 * (Math.min(A, B) / B))
            : C;
        health?.setCurrentValue(D);
        for (const guard of dimension.getEntities({ tags: ["cb2:ch_guard"] })) guard.remove();
        dimension.spawnParticle("cb2:crystal_king_tp_particle", centerLoc(0, 41, -41))
    } else if (tick === 140) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 160) {
        for (const player of players()) {
            player.teleport(centerLoc(0, 41, -25))
            player.setSpawnPoint({ "dimension": dimension, ...centerLoc(0, 42, -25) })
            player.camera.setCamera("minecraft:free", { "location": centerLoc(51, 12, -32), "facingLocation": centerLoc(0, 27, -25) })
            player.camera.addShake({ "intensity": 0.1, "duration": 8, "type": CameraShakeType.Positional })
        }
    } else if (tick === 170) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(20, 50, 22), "facingLocation": centerLoc(0, 27, -33), "easeOptions": { "easeType": EasingType.OutSine, "easeTime": 3 } })
        }
    } else if (tick === 230) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(20, 44, -32), "facingLocation": centerLoc(2, 44, -32) })
            player.camera.setCamera("minecraft:free", { "location": centerLoc(16, 44, -32), "facingLocation": centerLoc(2, 44, -32), "easeOptions": { "easeType": EasingType.OutSine, "easeTime": 3 } })
        }
    } else if (tick === 290) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 42.5, -53), "facingLocation": centerLoc(0, 42.5, -25) })
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 42.5, -26), "facingLocation": centerLoc(0, 42.5, -25), "easeOptions": { "easeTime": 1, "easeType": EasingType.OutSine } })
        }
    } else if (tick === 330) {
        dimension.fillBlocks(new BlockVolume({ x: -12, y: 32, z: -45 }, { x: 12, y: 32, z: -21 }), "cb2:crystaloak_leaves", { "blockFilter": { "includeTypes": ["minecraft:air"] } })
        dimension.fillBlocks(new BlockVolume({ x: -12, y: 24, z: -45 }, { x: 12, y: 24, z: -21 }), "cb2:crystaloak_leaves", { "blockFilter": { "includeTypes": ["minecraft:air"] } })
        dimension.fillBlocks(new BlockVolume({ x: -1, y: 16, z: -32 }, { x: 1, y: 16, z: -34 }), "cb2:crystaloak_leaves", { "blockFilter": { "includeTypes": ["minecraft:air"] } })
        crystalKing().removeTag("cb2:stop");
        for (const player of players()) {
            player.camera.clear();
        }
    } else if (tick >= 331) {
        tickStop();
        const defeatCondition = !crystalKing();
        if (defeatCondition) {
            world.setDynamicProperty("cb2:ch_tick", 0)
            world.setDynamicProperty("cb2:ch_chapter", 4)
            tickStart();
        }
    }
    if (tick < 330 && tick > 120) {
        crystalKing().teleport(centerLoc(0, 41, -41))
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
const kingChapterEnd = (dimension: Dimension, tick: number, stop: boolean) => {
    for (const player of players()) {
        player.playSound("random.totem", { "pitch": 1.5 });
    }
    CrystalHorizonResetFn("blue");
    const portal = dimension.getBlock({ x: 0, y: 2, z: 0 });
    portal?.setPermutation(portal?.permutation.withState("cb2:portal" as any, "out"));
    world.setDynamicProperty("cb2:ch_chapter", -1);
    world.setDynamicProperty("cb2:ch_tick", 0);
};

// 2つのベクトルの外積を計算するヘルパー関数
const crossProduct = (a: Vector3, b: Vector3): Vector3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
});

// ベクトルの正規化（長さを1にする）
const normalize = (v: Vector3): Vector3 => {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
};

export const growSpike = async (
    dimension: Dimension,
    location: Vector3,
    direction: Vector3, // 伸びる方向を指定するベクトル (例: { x: 1, y: 1, z: 0 })
    radius: number,
    height: number,
    block: string
) => {
    // 伸びる方向の単位ベクトル
    const dir = normalize(direction);

    // 方向(dir)に直交する2つの基準軸(u, v)を求める（円断面を回すため）
    const arbitrary = Math.abs(dir.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const u = normalize(crossProduct(dir, arbitrary));
    const v = crossProduct(dir, u);

    for (let h = 0; h < height; h++) {
        await sleep(1);
        const offset = radius * (1 - h / height);

        // 現在のレイヤーの中心位置
        const center = {
            x: location.x + dir.x * h,
            y: location.y + dir.y * h,
            z: location.z + dir.z * h
        };

        for (let d = 0; d < 360; d += 5) { // ※度数のステップを刻むと処理が軽くなります
            const radian = (d * Math.PI) / 180;
            const cos = Math.cos(radian) * offset;
            const sin = Math.sin(radian) * offset;

            // 基準軸 u, v を使って円周上の座標を計算
            const targetX = Math.floor(center.x + u.x * cos + v.x * sin);
            const targetY = Math.floor(center.y + u.y * cos + v.y * sin);
            const targetZ = Math.floor(center.z + u.z * cos + v.z * sin);

            const targetLocation: Vector3 = { x: targetX, y: targetY, z: targetZ };
            const targetBlock = dimension.getBlock(targetLocation);

            if (targetBlock?.typeId !== "minecraft:air") continue;
            dimension.setBlockType(targetLocation, block);
        }
    }
};
const landSpike = (dimension: Dimension, location: Vector3, area: number, blocks: string[] = ["cb2:clear_red_crystal_block"]) => {
    // 全体の範囲の半分（オフセット）を計算
    const offsetX = (area * 4) / 2;
    const offsetZ = (area * 4) / 2;

    for (let dx = 0; dx < area; dx++) {
        for (let dz = 0; dz < area; dz++) {
            if (dx !== 0 && dx !== area - 1 && dz !== 0 && dz !== area - 1) {
                continue;
            }
            // location を中心にするためにオフセットを引く
            const targetX = location.x - offsetX + dx * 4 + Math.random() * 4;
            const targetZ = location.z - offsetZ + dz * 4 + Math.random() * 4;
            const targetLocation: Vector3 = { x: targetX, y: location.y, z: targetZ };
            if (dimension.getEntities({ location: targetLocation, maxDistance: 6, type: "cb2:crystal_miracles" }).length > 0) continue;
            const select = blocks[Math.random() * blocks.length | 0]
            growSpike(dimension, targetLocation, { x: 0, y: 1, z: 0 }, 4, 64, select);
        }
    }
}
export const chainSpike = async (
    dimension: Dimension,
    startLocation: Vector3,
    initialDirection: Vector3,
    initialRadius: number,
    initialHeight: number,
    maxGenerations: number = 3, // 再帰の深さ（世代数）
    branchProbability: number = 0.4, // 各高さで分岐が発生する確率 (0.0〜1.0)
    blocks: string[]
) => {
    // 内部的な再帰処理関数
    const spawnSpikeRecursive = async (
        location: Vector3,
        direction: Vector3,
        radius: number,
        height: number,
        currentGen: number,
        blocks: string[]
    ) => {
        if (currentGen > maxGenerations || radius < 1 || height < 2) return;

        // 1. 現在のトゲを生成
        await growSpike(dimension, location, direction, radius, height, blocks);

        // 世代上限に達している場合は子トゲを生やさない
        if (currentGen >= maxGenerations) return;

        const dir = normalize(direction);

        // トゲの高さ方向に沿って、途中の位置から分岐を判定
        for (let h = Math.floor(height * 0.3); h < height * 0.8; h += 2) {
            if (Math.random() > branchProbability) continue;

            // 分岐地点の中心座標
            const currentCenter: Vector3 = {
                x: location.x + dir.x * h,
                y: location.y + dir.y * h,
                z: location.z + dir.z * h
            };

            // ランダムな斜め方向のベクトル（枝分かれ方向）を計算
            const randomAngle = Math.random() * Math.PI * 2;
            const arbitrary = Math.abs(dir.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
            const u = normalize(crossProduct(dir, arbitrary));
            const v = crossProduct(dir, u);

            // 親トゲの外側に向かうラジアル方向
            const branchOutDir: Vector3 = {
                x: u.x * Math.cos(randomAngle) + v.x * Math.sin(randomAngle),
                y: u.y * Math.cos(randomAngle) + v.y * Math.sin(randomAngle),
                z: u.z * Math.cos(randomAngle) + v.z * Math.sin(randomAngle)
            };

            // 親の進行方向(dir)と外向き(branchOutDir)を合成して斜めに伸びる方向を作成
            const childDirection: Vector3 = normalize({
                x: dir.x * 0.5 + branchOutDir.x * 0.8,
                y: dir.y * 0.5 + branchOutDir.y * 0.8,
                z: dir.z * 0.5 + branchOutDir.z * 0.8
            });

            // 親トゲの表面付近に発生地点を調整
            const currentRadius = radius * (1 - h / height);
            const branchStartLocation: Vector3 = {
                x: currentCenter.x + branchOutDir.x * currentRadius,
                y: currentCenter.y + branchOutDir.y * currentRadius,
                z: currentCenter.z + branchOutDir.z * currentRadius
            };

            // 子トゲのサイズ（親より小さく設定）
            const childRadius = Math.max(1, radius * 0.6);
            const childHeight = Math.max(2, height * 0.65);

            // 再帰的に子トゲを生成
            spawnSpikeRecursive(
                branchStartLocation,
                childDirection,
                childRadius,
                childHeight,
                currentGen + 1,
                blocks
            );
        }
    };

    // ルートトゲの発動
    spawnSpikeRecursive(startLocation, initialDirection, initialRadius, initialHeight, 1, blocks);
};
const crystMiracleStand = () => dimension.getEntities({ type: "cb2:crystal_miracle_stand" })[0];
const crystalMiracle = () => dimension.getEntities({ type: "cb2:crystal_miracle" })[0];
const miracleChapter1 = async (dimension: Dimension, tick: number, stop: boolean) => {
    const targetLoc: Vector3 = { x: 0.5, y: 0, z: -24.5 };

    if (tick === 10) {
        world.tickingAreaManager.createTickingArea(`cb2:a`, {
            dimension: dimension,
            from: { x: 64, y: 64, z: 64 },
            to: { x: -64, y: -16, z: -64 }
        })
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 0.5, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 25) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -1), "facingLocation": centerLoc(0, 2, -2) });
            player.teleport(centerLoc(0, 1, 1));
        }
    } else if (tick === 40) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(1, 2, -18), "facingLocation": centerLoc(0, 1, -24), "easeOptions": { "easeTime": 3, "easeType": EasingType.InOutSine } });
        }
    } else if (tick === 80) {
        dimension.spawnParticle("cb2:crystal_king_spawn_particle", targetLoc);
        dimension.spawnEntity<"cb2:crystal_miracle_stand">("cb2:crystal_miracle_stand", targetLoc);
    } else if (tick === 120) {
        landSpike(dimension, centerLoc(0, 0, -24), 16);
        for (const player of players()) {
            player.teleport(centerLoc(0, 0, -12))
            player.setRotation({ x: 45, y: 0 })
            player.camera.addShake({ "intensity": 1, "duration": 0.8, "type": CameraShakeType.Positional })
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 0, -6), "facingLocation": centerLoc(0, 4, -24), "easeOptions": { "easeTime": 0.8, "easeType": EasingType.OutSine } });
            for (let i = 0; i < 4; i++) {
                (async () => {
                    await sleep(Math.random() * 4)
                    player.playSound("cbspawner_spawn")
                })()
            }
        }
    } else if (tick === 140) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 160) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(-5, 0, -30), "facingLocation": centerLoc(0, 1, -25) });
        }
    } else if (tick === 170) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(5, 12, -20), "facingLocation": centerLoc(0, 1, -25), "easeOptions": { "easeTime": 2, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 220) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(-6, 12, -5), "facingLocation": centerLoc(0, 1, -12) });
            player.camera.setCamera("minecraft:free", { "location": centerLoc(9, 0, -5), "facingLocation": centerLoc(0, 1, -12), "easeOptions": { "easeTime": 2, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 270) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(1, 1, -24), "facingLocation": centerLoc(0, 1, -12) });
            player.camera.setCamera("minecraft:free", { "location": centerLoc(1, 1, -10), "facingLocation": centerLoc(0, 1, -12), "easeOptions": { "easeTime": 1, "easeType": EasingType.InSine } });
        }
    } else if (tick === 290) {
        const { location } = crystMiracleStand();
        crystMiracleStand().remove();
        dimension.spawnEntity<"cb2:crystal_miracle">("cb2:crystal_miracle", location);
        for (const player of players()) {
            player.camera.clear();
        }
    } else if (tick > 290) {
        const defeatCondition = (crystalMiracle().getComponent("minecraft:health")?.currentValue ?? 0) < 125;
        if (defeatCondition) {
            for (const wander of dimension.getEntities({ tags: ["cb2:wander_under_miracle"] })) wander.remove();
            world.setDynamicProperty("cb2:ch_tick", 0);
            world.setDynamicProperty("cb2:ch_chapter", 2);
            return;
        }
        if (tick % 160 === 0) {
            (async () => {
                for (let i = 0; i < 3; i++) {
                    const miracle = crystalMiracle();
                    const { x, y, z } = miracle.location;
                    dimension.spawnParticle("cb2:crystal_king_tp_particle", miracle.location);
                    dimension.playSound("mob.endermen.portal", miracle.location);
                    const targetLocation: Vector3 = { x: x + Math.random() * 4 - 2, y: y, z: z + Math.random() * 4 - 2 };
                    if (!dimension.getBlock(targetLocation)?.isAir) continue;
                    miracle.teleport(targetLocation);

                    if (dimension.getEntities({ tags: ["cb2:wander_under_miracle"] }).length < 6) {
                        crystalSpawnFn(dimension, "cb2:crystal_wander", targetLocation, Color[["blue", "red", "green", "yellow"][Math.random() * 4 | 0]], true, false).addTag("cb2:wander_under_miracle");
                    }
                    await sleep(2)
                }
            })()
        }
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
const miracleChapter2 = (dimension: Dimension, tick: number, stop: boolean) => {
    if (tick === 0) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 20) {
        crystalMiracle().remove()
        dimension.spawnEntity("cb2:crystal_miracle_stand", centerLoc(0, 0, -24));
        for (const player of players()) {
            player.teleport(centerLoc(0, 0, -16))
            player.camera.setCamera("minecraft:free", { "location": centerLoc(6, 0, -20), "facingLocation": centerLoc(0, 0, -20) })
        }
    } else if (tick === 30) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(8, 0, -20), "facingLocation": centerLoc(0, 0, -20), "easeOptions": { "easeTime": 2, "easeType": EasingType.InOutSine } })
        }
    } else if (tick === 70) {
        chainSpike(
            dimension,
            { x: 0, y: 0, z: -20 },
            { x: 0, y: 1, z: 0 },
            6,
            32,
            9,
            0.5,
            ["cb2:red_clear_crystal_block"]
        );
        const miracle = crystMiracleStand();
        dimension.spawnParticle("cb2:crystal_king_tp_particle", miracle.location);
        miracle.teleport(centerLoc(0, 48, -20));
        for (const player of players()) {
            player.camera.addShake({ "duration": 2, "intensity": 0.5, "type": CameraShakeType.Positional });
            player.camera.setCamera("minecraft:free", { "location": centerLoc(16, 8, -20), "facingLocation": centerLoc(0, 16, -20), "easeOptions": { "easeTime": 1, "easeType": EasingType.InOutSine } });
        }
        for (let i = 0; i < 8; i++) {
            const blockId = `cb2:framed_${["", "red_", "green_", "yellow_"][Math.random() * 4 | 0]}crystal_block`;
            const { x, y, z } = centerLoc(0, 1, -33);
            const randomLocation = { x: x + Math.random() * 2, y: y, z: z + Math.random() * 2 }
            dimension.spawnItem(new ItemStack(blockId, 16), randomLocation)
        }
    } else if (tick === 80) {
        for (const player of players()) {
            (async () => {
                for (let i = 1; i <= 4; i++) {
                    player.playSound("mob.endermen.portal", { pitch: i / 2 });
                    await sleep(1)
                }
            })()
        }
    } else if (tick === 110) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 130) {
        for (const player of players()) {
            player.camera.clear();
        }
    } else if (tick === 131) {
        if (!stop) tickStop();
        const arrivalPlayer = players().find(({ location: { y } }) => {
            return y > 32;
        })
        if (!arrivalPlayer) return;
        world.setDynamicProperty("cb2:ch_tick", 0)
        world.setDynamicProperty("cb2:ch_chapter", 3)
        tickStart();
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
const miracleChapter3 = (dimension: Dimension, tick: number, stop: boolean) => {
    if (tick === 0) {
        try {
            for (const player of players()) {
                player.camera.addShake({ "intensity": 2, "duration": 0.5, "type": CameraShakeType.Positional })
            }
            const player = players()[0];
            player.addEffect("resistance", 10, { "amplifier": 255 });
            player.addEffect("slow_falling", 80, { "amplifier": 0 });
            const miracle = dimension.spawnEntity("cb2:crystal_miracle", player.location);
            miracle.addEffect("resistance", 10, { "amplifier": 255 });
            miracle.addEffect("slow_falling", 80, { "amplifier": 1 });
            miracle.addEffect("levitation", 2, { "amplifier": 64 });
            miracle.addTag("cb2:powder_bottle_ex");
            const miralceHealth = miracle.getComponent("minecraft:health");
            miralceHealth?.setCurrentValue(64);
            try { crystMiracleStand().remove(); } catch (_) { }
            (async () => {
                for (let i = 0; i < 6; i++) {
                    const miracle = crystalMiracle();
                    const { x, y, z } = miracle.location;
                    const targetLocation: Vector3 = { x: x + Math.random() * 4 - 2, y: y, z: z + Math.random() * 4 - 2 };
                    if (!dimension.getBlock(targetLocation)?.isAir) continue;

                    if (dimension.getEntities({ tags: ["cb2:wander_under_miracle"] }).length < 6) {
                        const wander = crystalSpawnFn(dimension, "cb2:crystal_wander", targetLocation, Color[["blue", "red", "green", "yellow"][Math.random() * 4 | 0]], true, false);
                        wander.addTag("cb2:wander_under_miracle");
                        wander.addEffect("resistance", 10, { "amplifier": 255 });
                        wander.addEffect("slow_falling", 80, { "amplifier": 1 });
                    }
                    await sleep(2)
                }
            })()
            dimension.createExplosion(player.location, 16, { "breaksBlocks": true, "source": crystMiracleStand() });
        } catch (_) { }
    } else if (tick > 20) {
        const defeatCondition = !crystalMiracle();
        if (defeatCondition) {
            world.setDynamicProperty("cb2:ch_tick", 0)
            world.setDynamicProperty("cb2:ch_chapter", 4)
            tickStart();
        }
        if (tick % 160 === 0) {
            (async () => {
                for (let i = 0; i < 3; i++) {
                    dimension.playSound("bottle.fill", crystalMiracle().location, { "pitch": 2 })
                    const randomVector: Vector3 = { x: Math.random() / 4, y: Math.random(), z: Math.random() / 4 };
                    const { x, y, z } = crystalMiracle().location
                    const proj = dimension.spawnEntity(`cb2:powder_bottle_${["blue", "red", "green", "yellow"][Math.random() * 4 | 0]}_proj`, { x: x + Math.random(), y: y + 2, z: z + Math.random() });
                    proj.applyImpulse(randomVector);
                    await sleep(2)
                }
            })()
        }
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
const miracleChapterEnd = (dimension: Dimension, tick: number, stop: boolean) => {
    for (const player of players()) {
        player.playSound("random.totem", { "pitch": 1.5 });
    }
    CrystalHorizonResetFn("red");
    const portal = dimension.getBlock({ x: 0, y: 2, z: 0 });
    portal?.setPermutation(portal?.permutation.withState("cb2:portal" as any, "out"));
    world.setDynamicProperty("cb2:ch_chapter", -1);
    world.setDynamicProperty("cb2:ch_tick", 0);
}

const kmChapter1 = (dimension: Dimension, tick: number, stop: boolean) => {
    if (tick === 10) {
        world.tickingAreaManager.createTickingArea(`cb2:a`, {
            dimension: dimension,
            from: { x: 64, y: 64, z: 64 },
            to: { x: -64, y: -16, z: -64 }
        })
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 0.5, "fadeOutTime": 0.5 } });
        }
    } else if (tick === 25) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -1), "facingLocation": centerLoc(0, 2, -2) });
            player.teleport(centerLoc(0, 1, 1));
        }
    } else if (tick === 40) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -18), "facingLocation": centerLoc(0, 1, -24), "easeOptions": { "easeTime": 3, "easeType": EasingType.InOutSine } });
        }
    } else if (tick === 100) {
        dimension.spawnParticle("cb2:crystal_king_spawn_particle", { x: 4.5, y: 0, z: -24.5 });
        dimension.spawnEntity<"cb2:crystal_king_health">("cb2:crystal_king_health", { x: 4.5, y: 0, z: -24.5 });
        const crystalKingStand = dimension.spawnEntity<"cb2:crystal_king_stand">("cb2:crystal_king_stand", { x: 4.5, y: 0, z: -24.5 });
        animate(crystalKingStand, "animation.crystal_king.idle", 1024);
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -18), "facingLocation": centerLoc(4, 1, -24), "easeOptions": { "easeTime": 1, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 120) {
        dimension.spawnParticle("cb2:crystal_king_spawn_particle", { x: -3.5, y: 0, z: -24.5 });
        dimension.spawnEntity<"cb2:crystal_miracle_stand">("cb2:crystal_miracle_stand", { x: -3.5, y: 0, z: -24.5 });
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 2, -18), "facingLocation": centerLoc(-4, 1, -24), "easeOptions": { "easeTime": 1, "easeType": EasingType.OutSine } });
        }
    } else if (tick === 140) {
        for (const player of players()) {
            player.camera.setCamera("minecraft:free", { "location": centerLoc(0, 1, -9), "facingLocation": centerLoc(0, 2, -18), "easeOptions": { "easeTime": 3, "easeType": EasingType.InOutSine } });
        }
    } else if (tick === 200) {
        const outLocation: Vector3 = { x: 4.5, y: 8, z: -32.5 };
        const crystalKingStand = crystKingStand();
        dimension.spawnParticle("cb2:crystal_king_tp_particle", crystalKingStand.location);
        dimension.spawnParticle("cb2:crystal_king_tp_particle", outLocation);
        crystalKingStand.remove();
        dimension.spawnEntity<"cb2:crystal_king_stand">("cb2:crystal_king_stand", outLocation).addTag("facing");
        animate(crystKingStand(), "animation.crystal_king.to_fly", 1024);
        landSpike(dimension, centerLoc(0, 0, -24), 16, ["cb2:clear_red_crystal_block", "cb2:clear_crystal_block"]);
        for (const player of players()) {
            player.teleport(centerLoc(0, 0, -12))
            player.setRotation({ x: 45, y: 180 })
            player.camera.addShake({ "intensity": 1, "duration": 0.8, "type": CameraShakeType.Positional })
            player.playSound("mob.endermen.portal");
            for (let i = 0; i < 4; i++) {
                (async () => {
                    await sleep(Math.random() * 4)
                    player.playSound("cbspawner_spawn")
                })()
            }
        }
    } else if (tick === 260) {
        for (const player of players()) {
            player.camera.fade({ "fadeTime": { "fadeInTime": 0.5, "holdTime": 1, "fadeOutTime": 0.5 } });
        }
    }
    if (!stop) world.setDynamicProperty("cb2:ch_tick", tick + 1);
}
let dimension!: Dimension
system.run(() => {
    dimension = world.getDimension("cb2:crystal_horizon");
    if (!world.tickingAreaManager.hasTickingArea("cb2:crystal_horizon_spawn")) world.tickingAreaManager.createTickingArea("cb2:crystal_horizon_spawn", {
        "dimension": dimension,
        "from": { x: -32, y: 0, z: -32 },
        "to": { x: 32, y: 32, z: 32 }
    })
    if (+(world.getDynamicProperty("cb2:ch_chapter") ?? 0) === 0) {
        tickStop();
    }
})

system.runInterval(() => {
    const stop = !!world.getDynamicProperty("cb2:ch_stop");

    const tick = +(world.getDynamicProperty("cb2:ch_tick") ?? 0);
    const chapter = +(world.getDynamicProperty("cb2:ch_chapter") ?? 0);
    if (chapter === -1) {
        tickStop();
        return;
    }
    const bossType = world.getDynamicProperty("cb2:ch_boss_type");
    if (!stop && chapter === 0) {
        world.setDynamicProperty("cb2:ch_chapter", 1);
        return
    }
    if (bossType === "king") {
        if (chapter === 1) kingChapter1(dimension, tick, stop);
        else if (chapter === 2) kingChapter2(dimension, tick, stop);
        else if (chapter === 3) kingChapter3(dimension, tick, stop);
        else if (chapter === 4) kingChapterEnd(dimension, tick, stop);
    } else if (bossType === "miracle") {
        if (chapter === 1) miracleChapter1(dimension, tick, stop);
        else if (chapter === 2) miracleChapter2(dimension, tick, stop);
        else if (chapter === 3) miracleChapter3(dimension, tick, stop);
        else if (chapter === 4) miracleChapterEnd(dimension, tick, stop);
    } else if (bossType === "king&miracle") {
        if (chapter === 1) kmChapter1(dimension, tick, stop);
    }
    else return;
}, 1)

export const playderDieInHorizon = ({ deadEntity }: EntityDieAfterEvent) => {
    const { dimension, location } = deadEntity;
    if (dimension.id !== "cb2:crystal_horizon") return;
    if (deadEntity.typeId !== "minecraft:player") return;
    const itemEntities = dimension.getEntities({ type: "minecraft:item" });
    for (const item of itemEntities) {
        item.teleport(centerLoc(0, 42, -25));
    }
}