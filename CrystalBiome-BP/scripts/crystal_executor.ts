import { Block, Dimension, Entity, MolangVariableMap, system, Vector3 } from "@minecraft/server";
import { sleep } from "./other";

type CrystalExecutor = Entity & { "typeId": "cb2:crystal_executor", };
type PropertyType = string | number | boolean | Vector3 | undefined;
type GetTimePropReturn = { "timeout": number, "clock": number };

const randomLeng: number[] = [40, 60, 80];

const getProperty = (entity: Entity, name: string): PropertyType => entity.getDynamicProperty(name);
const setProperty = (entity: Entity, name: string, value: PropertyType): void => entity.setDynamicProperty(name, value);
const getExecutors = (dimension: Dimension): CrystalExecutor[] | undefined => {
    const getEntities: Entity[] | [] = dimension.getEntities({ "type": "cb2:crystal_executor" });
    if (getEntities.length === 0) return;
    return getEntities as CrystalExecutor[];
};
const hasEnemyNearby = (dimension: Dimension, location: Vector3): boolean => dimension.getEntities({
    location: location,
    maxDistance: 16,
    excludeFamilies: ["crystal"]
}).length > 0;
const getTimeProperty = (executor: CrystalExecutor): GetTimePropReturn => {
    const result = { "timeout": 0, "clock": 0 };

    const getTimeout: PropertyType = getProperty(executor, "cb2:executor_timeout");
    if (typeof getTimeout === "number") result.timeout = getTimeout;
    else result.timeout = randomLeng[Math.random() * 3 | 0];

    const getClock: PropertyType = getProperty(executor, "cb2:executor_clock");
    if (typeof getClock === "number") result.clock = getClock;
    else result.clock = 0;

    return result;
};
const timesReset = (executor: CrystalExecutor, halfTime: boolean): void => {
    const selectLeng: number = halfTime ? randomLeng[Math.random() * 3 | 0] / 2 : randomLeng[Math.random() * 3 | 0];
    setProperty(executor, "cb2:executor_timeout", selectLeng);
    setProperty(executor, "cb2:executor_clock", 0);
};
const hmmWait = (executor: CrystalExecutor): boolean => {
    const isWait: boolean = !!getProperty(executor, "cb2:executor_wait");
    const currWaitTime: number = +(getProperty(executor, "cb2:executor_wait_time") ?? 0) || 0;
    const nextWaitTime: number = isWait ? currWaitTime + 1 : 0;
    setProperty(executor, "cb2:executor_wait_time", nextWaitTime);
    if (isWait && nextWaitTime < 160) return false;

    setProperty(executor, "cb2:executor_wait_time", 0);
    setProperty(executor, "cb2:executor_wait", false);
    return true;
};
const summonSpikeLine = async (dimension: Dimension, location: Vector3, dirX: number, dirZ: number) => {
    for (let i: number = 0; i < 24; i++) {
        await sleep(1);
        if (i === 0) {
            location.x += dirX * 2;
            location.z += dirZ * 2
        }
        const offset: number = i * 1;
        const next: Vector3 = {
            x: location.x + dirX * offset,
            y: location.y,
            z: location.z + dirZ * offset
        };
        if (dimension.getBlock(next)?.typeId !== "minecraft:air") {
            while (dimension.getBlock(next)?.typeId !== "minecraft:air") {
                next.y += 1;
            }
        } else if (dimension.getBlock({ x: next.x, y: next.y - 1, z: next.z })?.typeId === "minecraft:air") {
            while (dimension.getBlock({ x: next.x, y: next.y - 1, z: next.z })?.typeId === "minecraft:air") {
                next.y -= 1;
            }
        };
        try { dimension.spawnEntity("cb2:crystal_spike_executor", next) } catch(e) {};
    }
};
const summonSpikeTwoWay = (executor: CrystalExecutor, rot: Vector3): void => {
    summonSpikeLine(executor.dimension, executor.location, rot.x + (rot.z * 0.2), rot.z + (-rot.x * 0.2));
    summonSpikeLine(executor.dimension, executor.location, rot.x + (-rot.z * 0.2), rot.z + (rot.x * 0.2));
};
const summonSpikeThreeWay = (executor: CrystalExecutor, rot: Vector3): void => {
    summonSpikeLine(executor.dimension, executor.location, rot.x, rot.z);
    summonSpikeLine(executor.dimension, executor.location, rot.x + (rot.z * 0.5), rot.z + (-rot.x * 0.5));
    summonSpikeLine(executor.dimension, executor.location, rot.x + (-rot.z * 0.5), rot.z + (rot.x * 0.5));
};
const summonSpikeCircle = async (location: Vector3, dimension: Dimension, radius: number, per: number, rotation: string) => {
    const step = 360 / per;
    for (let i: number = 0; i < per; i++) {
        await sleep(1);
        const radian: number = step * i * (Math.PI / 180);
        const next = {
            x: location.x + radius * (rotation === "right" ? Math.sin(radian) : Math.cos(radian)),
            y: location.y,
            z: location.z + radius * (rotation === "right" ? Math.cos(radian) : Math.sin(radian))
        };
        try { dimension.spawnEntity("cb2:crystal_spike_executor", next) } catch(e) {};
    }
}


const executorAttack = async (executor: CrystalExecutor, halfHealth: boolean) => {
    if (!hmmWait(executor)) return;
    setProperty(executor, "cb2:executor_wait", true);

    const { dimension, location } = executor;
    if (Math.random() < 0.8) {
        executor.playAnimation("animation.crystal_executor.cluster_attack");
        await sleep(20);
        if (!halfHealth) summonSpikeTwoWay(executor, executor.getViewDirection());
        else summonSpikeThreeWay(executor, executor.getViewDirection());
    } else {
        executor.addEffect("slowness", 40, { "amplifier": 255 });
        executor.playAnimation("animation.crystal_executor.cluster_center");
        await sleep(30);
        summonSpikeCircle(location, dimension, 2, 8, "right");
        summonSpikeCircle(location, dimension, 4, 16, "left");
        if (halfHealth) summonSpikeCircle(location, dimension, 6, 24, "right");
    }

    setProperty(executor, "cb2:executor_wait_time", 0);
    setProperty(executor, "cb2:executor_wait", false);
    timesReset(executor, halfHealth);
};
const run = (dimension: Dimension): void => {
    const executors: CrystalExecutor[] | undefined = getExecutors(dimension);
    if (!executors) return;
    for (const executor of executors) {
        if (!hasEnemyNearby(executor.dimension, executor.location)) continue;

        const isHalfHealth: boolean = (executor.getComponent("minecraft:health")?.currentValue ?? 0) < 100;

        const { timeout, clock }: GetTimePropReturn = getTimeProperty(executor);
        setProperty(executor, "cb2:executor_timeout", timeout);
        setProperty(executor, "cb2:executor_clock", clock + 1);
        if (clock < timeout) continue;

        executorAttack(executor, isHalfHealth);
    }
};


export default {
    run
}