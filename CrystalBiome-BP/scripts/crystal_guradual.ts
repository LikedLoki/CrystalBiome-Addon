import { Entity, EntityDieAfterEvent, ItemStack, system, Vector2, Vector3, World, world } from "@minecraft/server";
import { sleep } from "./other";
import { PrismInfo } from "./crystal-biome";
import { PrismInfoAdmin } from "./prism-info-fn";

/*
 * "cb2:crystal_guradual_guard": number(0, 1, 2) - クリスタルガード系譜(ガード, エグゼクター, キング)の進行度
 * "cb2:crystal_guradual_wander": number(0, 1, 2) - クリスタルワンダー系譜(ワンダー, ワンダーメント, ミラクル)の進行度
 * "cb2:crystal_guradual_clustfragm": boolean - クラスターフラグメントが討伐されたか
 */

export let guradualClustFragm: boolean = false
export let guradualGuard: number = 0;
export let guradualWander: number = 0;

system.run(() => {
    guradualClustFragm = !!world.getDynamicProperty("cb2:crystal_guradual_clustfragm");
    guradualGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0)
    guradualWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
})
system.runInterval(() => {
    guradualClustFragm = !!world.getDynamicProperty("cb2:crystal_guradual_clustfragm");
    guradualGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0)
    guradualWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
}, 640);

export const SlayedClusterFragment = (world: World, entity: Entity) => {
    if (entity.typeId !== "cb2:cluster_fragment") return;
    const current: boolean = !!world.getDynamicProperty("cb2:crystal_guradual_clustfragm");
    if (current) return;
    world.setDynamicProperty("cb2:crystal_guradual_clustfragm");
    guradualClustFragm = !!world.getDynamicProperty("cb2:crystal_guradual_clustfragm");
};

export const SlyaedExecutor = (world: World, entity: Entity) => {
    if (entity.typeId !== "cb2:crystal_executor") return;

    const homeLoc = entity.getDynamicProperty("cb2:homeLoc") as Vector3 | undefined;
    if (!homeLoc) return;
    const { dimension } = entity;
    const bossType = dimension.getBlock(homeLoc)?.permutation.getState("cb2:boss_type" as any) as "executor" | "wanderment" | undefined;
    if (!bossType) return;
    dimension.setBlockType(homeLoc, "minecraft:air");
    dimension.spawnItem(new ItemStack(bossType === "executor" ? "cb2:executor_reverberation" : "cb2:wanderment_reverberation"), homeLoc);
    dimension.playSound("item.trident.thunder", homeLoc, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", homeLoc);

    const currentGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0)
    if (currentGuard > 0) return;
    const prismAdmin = new PrismInfoAdmin(world);
    prismAdmin.queueRaid("mega_raid_executor");
    prismAdmin.apply(world);
    world.setDynamicProperty("cb2:crystal_guradual_guard", 1);
    guradualGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0);
};

export const SlyaedWanderment = (world: World, entity: Entity) => {
    if (entity.typeId !== "cb2:crystal_wanderment") return;

    const homeLoc = entity.getDynamicProperty("cb2:homeLoc") as Vector3 | undefined;
    if (!homeLoc) return;
    const { dimension } = entity;
    const bossType = dimension.getBlock(homeLoc)?.permutation.getState("cb2:boss_type" as any) as "executor" | "wanderment" | undefined;
    if (!bossType) return;
    dimension.setBlockType(homeLoc, "minecraft:air");
    dimension.spawnItem(new ItemStack(bossType === "executor" ? "cb2:executor_reverberation" : "cb2:wanderment_reverberation"), homeLoc);
    dimension.playSound("item.trident.thunder", homeLoc, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", homeLoc);

    const currentWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
    if (currentWander > 0) return;
    world.setDynamicProperty("cb2:crystal_guradual_wander", 1);
    guradualWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
};

const executorMessage = async (world: World) => {
    await sleep(20);
    world.sendMessage(`§o...`);
    await sleep(40);
    world.sendMessage(`§o... ...`);
    await sleep(40);
    world.sendMessage(`§o... ... ...`);
}

const wandermentMessage = async (world: World) => {
    await sleep(20);
    world.sendMessage(`§o...`);
    await sleep(40);
    world.sendMessage(`§o... ...`);
    await sleep(40);
    world.sendMessage(`§o... ... ...`);
}

export const slayedCrystalKing = (event: EntityDieAfterEvent) => {
    const { deadEntity } = event;
    const { dimension } = deadEntity;
    if (deadEntity.typeId !== "cb2:crystal_king") return;
    dimension.playSound("item.trident.thunder", deadEntity.location, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", deadEntity.location);
    world.setDynamicProperty("cb2:crystal_guradual_guard", 2);
}
export const slayedCrystalMiracle = (event: EntityDieAfterEvent) => {
    const { deadEntity } = event;
    const { dimension } = deadEntity;
    if (deadEntity.typeId !== "cb2:crystal_miracle") return;
    dimension.playSound("item.trident.thunder", deadEntity.location, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", deadEntity.location);
    world.setDynamicProperty("cb2:crystal_guradual_wander", 2);
}