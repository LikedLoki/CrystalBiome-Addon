import { Entity, system, World, world } from "@minecraft/server";
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
    const currentGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0)
    if (currentGuard > 0) return;
    const prismAdmin = new PrismInfoAdmin(world);
    prismAdmin.queueRaid("mega_raid_executor");
    prismAdmin.apply(world);
    world.setDynamicProperty("cb2:crystal_guradual_guard", 1);
    guradualGuard = +(world.getDynamicProperty("cb2:crystal_guradual_guard") || 0);
    executorMessage(world);
};

export const SlyaedWanderment = (world: World, entity: Entity) => {
    if (entity.typeId !== "cb2:crystal_wanderment") return;
    const currentWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
    if (currentWander > 0) return;
    world.setDynamicProperty("cb2:crystal_guradual_wander", 1);
    guradualWander = +(world.getDynamicProperty("cb2:crystal_guradual_wander") || 0)
    wandermentMessage(world);
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