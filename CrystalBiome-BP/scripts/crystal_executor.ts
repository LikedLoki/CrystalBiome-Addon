import { Dimension, Entity, MolangVariableMap, system, Vector3 } from "@minecraft/server";
import { sleep, summonCircle, summonLine, summonLineOption } from "./other";

interface BossInfo {
    "timeout": number,
    "currTick": number,
    "wait": boolean,
    "waitTick": number,
    "secondCounter": number
};

async function executorAttack(executor: Entity, dimension: Dimension, bossInfo: BossInfo, half: boolean): Promise<void> {
    if (bossInfo.waitTick >= 80) {
        bossInfo.wait = false;
        bossInfo.waitTick = 0;
    };
    if (bossInfo.wait ?? false) {
        bossInfo.waitTick++;
        executor.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
        return;
    };
    bossInfo.wait = true;
    executor.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
    if (Math.random() < 0.8) {
        executor.playAnimation("animation.crystal_executor.cluster_attack");
        await sleep(20);
        const rot: Vector3 = executor.getViewDirection();
        const option: summonLineOption = {
            "amount": 24,
            "dimension": dimension,
            "entityId": "cb2:crystal_spike_executor",
            "firstSpace": 2,
            "location": executor.location,
        };
        bossInfo.wait = false;
        const rightRot1 = {
            x: rot.x + (rot.z * 0.2),
            y: rot.y,
            z: rot.z + (-rot.x * 0.2)
        };
        const leftRot1 = {
            x: rot.x + (-rot.z * 0.2),
            y: rot.y,
            z: rot.z + (rot.x * 0.2)
        };
        const rightRot2 = {
            x: rot.x + (rot.z * 0.5),
            y: rot.y,
            z: rot.z + (-rot.x * 0.5)
        };
        const leftRot2 = {
            x: rot.x + (-rot.z * 0.5),
            y: rot.y,
            z: rot.z + (rot.x * 0.5)
        };
        dimension.playSound("random.explode", executor.location, { volume: 1, pitch: 1.2 });
        if (!half) {
            summonLine(option, rightRot1);
            summonLine(option, leftRot1);
        } else {
            summonLine(option, rot);
            summonLine(option, rightRot2);
            summonLine(option, leftRot2);
        }
    } else {
        executor.addEffect("slowness", 40, { amplifier: 255, showParticles: false });
        executor.playAnimation("animation.crystal_executor.cluster_center");
        await sleep(30);
        bossInfo.wait = false;
        dimension.playSound("random.explode", executor.location, { volume: 1, pitch: 0.8 });
        summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 2, 8, "right");
        summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 4, 16, "left");
        if (half) summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 6, 24, "right");
    };
    if (half) bossInfo.secondCounter++;
    bossInfo.currTick = 0;
    bossInfo.timeout = half ? randomLeng[Math.random() * 3 | 0] / 2 : randomLeng[Math.random() * 3 | 0];
    executor.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
}

const randomLeng: number[] = [40, 60, 80];
export function executorTimeLine(dimension: Dimension): void {
    const executors: Entity[] | [] = dimension.getEntities({
        "type": "cb2:crystal_executor"
    });
    if (executors.length === 0) return;
    for (let dataI = 0, lengI = executors.length; dataI < lengI; dataI++) {
        const hasEnemy: boolean = dimension.getEntities({
            "location": executors[dataI].location,
            "maxDistance": 16,
            "excludeFamilies": ["crystal"]
        }).length > 0;
        if (!hasEnemy) continue;
        const executor: Entity = executors[dataI];
        const bossInfo: BossInfo = JSON.parse(executor.getDynamicProperty("cb2:boss_info") as string | undefined ?? "{ \"timeout\": 0, \"currTick\": 0, \"wait\": false, \"waitTick\": 0, \"secondCounter\": 0 }");
        const halfHealth: boolean = bossInfo.secondCounter < 8 ? (executor.getComponent("minecraft:health")?.currentValue ?? 0) <= 50 : false;
        const vars: MolangVariableMap = new MolangVariableMap();
        if (halfHealth) {
            vars.setColorRGB("variable.color", Math.random() < 0.5 ? { red: 1, green: 1, blue: 1 } : { red: 0, green: 0, blue: 0 });
            const selectPos: Vector3 = { x: Math.random() * 4 - 2 + executor.location.x, y: Math.random() + executor.location.y, z: Math.random() * 4 - 2 + executor.location.z };
            dimension.spawnParticle("cb2:crystal_particle", selectPos, vars);
            executor.addEffect("speed", 10, { amplifier: 0 });
        }
        if (bossInfo.timeout === 0) bossInfo.timeout = randomLeng[Math.random() * 3 | 0];
        if (bossInfo.secondCounter === undefined) bossInfo.secondCounter = 0;
        bossInfo.currTick++;
        if (bossInfo.currTick < bossInfo.timeout) {
            executor.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
            continue;
        };
        executorAttack(executor, dimension, bossInfo, halfHealth);
    }
}