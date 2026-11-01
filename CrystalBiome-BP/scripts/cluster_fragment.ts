import { world, system, Dimension, Entity, Block, RawText, Player, ItemStack, World, Vector3 } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn";
import { sleep } from "./other";
import { Color, VectorDXYZ } from "./crystal-biome";

type SleepClusterFragment = Entity & { "typeId": "cb2:sleep_cluster_fragment" };
type ClusterFragment = Entity & { "typeId": "cb2:cluster_fragment" };
type PhaseState = "BAS" | "LFS";

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    if (deadEntity.typeId !== "cb2:cluster_fragment") return;
    const dimension: Dimension = deadEntity.dimension;
    const loc: Vector3 = deadEntity.location;
    dimension.playSound("item.trident.thunder", loc, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", { x: loc.x, y: loc.y + 2, z: loc.z });
});


const offset = [
    { dx: 6, dy: 1, dz: 0 }, { dx: -6, dy: 1, dz: 0 }, { dx: 0, dy: 1, dz: 6 }, { dx: 0, dy: 1, dz: -6 }
] as const;
const spawnOffset = [
    { dx: 2, dy: 1, dz: 0 }, { dx: -2, dy: 1, dz: 0 }, { dx: 0, dy: 1, dz: 2 }, { dx: 0, dy: 1, dz: -2 }
] as const;

const getSleepClustFragm = (dimension: Dimension): SleepClusterFragment[] | [] =>
    dimension.getEntities({
        "type": "cb2:sleep_cluster_fragment"
    }) as SleepClusterFragment[] | [];
const getClustFragm = (dimension: Dimension): ClusterFragment[] | [] =>
    dimension.getEntities({
        "type": "cb2:cluster_fragment"
    }) as ClusterFragment[] | [];
const getPhaseState = (clustfragm: ClusterFragment): PhaseState | undefined => {
    const getProp: unknown = clustfragm.getDynamicProperty("cb2:phase_state");
    if (getProp !== "BAS" && getProp !== "LFS") {
        clustfragm.setDynamicProperty("cb2:phase_state", "BAS");
        return;
    }
    return getProp;
};

const readyToSummon = (dimension: Dimension, { x, y, z }: Vector3) => {
    return offset.every(dataI => {
        const { dx, dy, dz } = dataI;
        const getBlock: Block | undefined = dimension.getBlock({ "x": x + dx, "y": y + dy, "z": z + dz });
        if (getBlock?.typeId !== "cb2:fragment_frame" || !getBlock.permutation.getState("cb2:summon" as any)) return false;
        return true;
    })
}

const forAwaking = async (dimension: Dimension, clustfragm: SleepClusterFragment) => {
    clustfragm.setDynamicProperty("cb2:awake", true);
    clustfragm.playAnimation("animation.sleep_cluster_fragment.awake");
    await sleep(120);
    for (const dataI of offset) {
        const { dx, dy, dz } = dataI;
        const getBlock: Block | undefined = dimension.getBlock({ "x": clustfragm.location.x + dx, "y": clustfragm.location.y + dy, "z": clustfragm.location.z + dz });
        if (getBlock?.typeId === "cb2:fragment_frame")
            getBlock.setPermutation(getBlock.permutation.withState("cb2:summon" as any, 2));
    }
    dimension.playSound("item.trident.thunder", clustfragm.location, { volume: 1, pitch: 0.8 });
    dimension.spawnParticle("cb2:crystal_boss_particle", clustfragm.location);
    dimension.spawnEntity("cb2:cluster_fragment" as any, clustfragm.location);
    clustfragm.remove();
};
const timerMap: Map<SleepClusterFragment, number> = new Map();
const sleepAndAwake = (dimension: Dimension, clustfragm: SleepClusterFragment): void => {
    const awaked: boolean = !!clustfragm.getDynamicProperty("cb2:awake");
    if (awaked) return;

    const isReady: boolean = readyToSummon(dimension, clustfragm.location);
    if (!isReady) return;

    forAwaking(dimension, clustfragm);
};
const barrierAndSummon = (dimension: Dimension, clustfragm: ClusterFragment): void => {
    let currFrame: number = 0;
    for (const dataI of offset) {
        const { dx, dy, dz } = dataI;
        let getBlock: Block | undefined;
        try {
            getBlock = dimension.getBlock({ "x": clustfragm.location.x + dx, "y": clustfragm.location.y + dy, "z": clustfragm.location.z + dz });
        } catch (_) { }
        if (!getBlock) currFrame = -1;
        if (getBlock?.typeId === "cb2:fragment_frame")
            currFrame++;
    }
    if (currFrame === 0) {
        clustfragm.setDynamicProperty("cb2:phase_state", "LFS");
        return;
    }
    for (let i = 0; i < currFrame; i++)
        dimension.spawnParticle("cb2:crystal_barrier_particle", clustfragm.location);
    clustfragm.addEffect("resistance", 20, { amplifier: 255, showParticles: false });
};
const lastFerceSummon = (dimension: Dimension, clustfragm: ClusterFragment): void => {
    const loc: Vector3 = clustfragm.location;
    const hasGuard: boolean = dimension.getEntities({
        location: loc,
        tags: [`cb2:fragment_guard_${loc.x}_${loc.y}_${loc.z}`]
    }).length >= 4;
    if (hasGuard) return;
    const select: VectorDXYZ = spawnOffset[Math.floor(Math.random() * spawnOffset.length)];
    const spawnId: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
    try { crystalSpawnFn(dimension, spawnId, { x: loc.x + select.dx, y: loc.y + select.dy, z: loc.z + select.dz }, Color[["red", "green", "blue", "yellow"][Math.random() * 4 | 0] as SettingColor]).addTag(`cb2:fragment_guard_${loc.x}_${loc.y}_${loc.z}`); }
    catch(_) {}
};

const phase = {
    "BAS": barrierAndSummon,
    "LFS": lastFerceSummon
} as const;

let callTimer = 0;
const main = (dimension: Dimension) => {
    if (callTimer < 20) {
        callTimer++;
        return;
    } else callTimer = 0;
    const sleepClustfragms: SleepClusterFragment[] | [] = getSleepClustFragm(dimension);
    if (sleepClustfragms.length > 0)
        for (const sleepClustfragm of sleepClustfragms)
            sleepAndAwake(dimension, sleepClustfragm);

    const clustfragms: ClusterFragment[] | [] = getClustFragm(dimension);
    if (clustfragms.length > 0)
        for (const clustfragm of clustfragms) {
            const phaseState: PhaseState | undefined = getPhaseState(clustfragm);
            if (!phaseState) return;

            phase[phaseState](dimension, clustfragm);
        }
};

export default {
    main
}