import { Dimension, Entity, MolangVariableMap, system, Vector3 } from "@minecraft/server";
import { sleep, summonCircle, summonLine, summonLineOption } from "./other";


export class ExecutorAdmin {
    static randomLeng: number[] = [40, 60, 80];
    static run(dimension: Dimension): void {
        const executors: Entity[] | [] = dimension.getEntities({
            type: "cb2:crystal_executor"
        });
        if (executors.length <= 0) return;
        for (let dataI = 0, lengI = executors.length; dataI < lengI; dataI++) {
            const executor: Entity = executors[dataI];
            const hasEnemy: boolean = dimension.getEntities({
                location: executor.location,
                maxDistance: 16,
                excludeFamilies: ["crystal"]
            }).length > 0;
            if (!hasEnemy) continue;
            const halfHealth: boolean = executor.getDynamicProperty("cb2:executor_second_counter") ?? 0 < 8 ? (executor.getComponent("minecraft:health")?.currentValue ?? 0) <= 50 : false;
            const vars: MolangVariableMap = new MolangVariableMap();
            if (halfHealth) {
                vars.setColorRGB("variable.color", Math.random() < 0.5 ? { red: 1, green: 1, blue: 1 } : { red: 0, green: 0, blue: 0 });
                const selectPos: Vector3 = { x: Math.random() * 4 - 2 + executor.location.x, y: Math.random() + executor.location.y, z: Math.random() * 4 - 2 + executor.location.z };
                dimension.spawnParticle("cb2:crystal_particle", selectPos, vars);
                executor.addEffect("speed", 10, { amplifier: 0 });
            }
            const timeout: number = this.execTimeout(executor);
            const currTick: number = executor.getDynamicProperty("cb2:executor_tick") as number | undefined ?? 0;
            executor.setDynamicProperty("cb2:executor_tick", currTick + 1);
            if (currTick >= timeout) continue;
            this.attack(executor, dimension, halfHealth);
        }
    }
    static execTimeout(executor: Entity): number {
        const getTimeout = executor.getDynamicProperty("cb2:executor_timeout") as number | undefined;
        const timeout = getTimeout ?? this.randomLeng[Math.random() * this.randomLeng.length | 0];
        if (getTimeout === undefined) executor.setDynamicProperty("cb2:executor_timeout", timeout);
        return timeout;
    }
    static async attack(executor: Entity, dimension: Dimension, halfHealth: boolean) {
        const isWaiting: boolean | undefined = executor.getDynamicProperty("cb2:executor_wait") as boolean | undefined;
        if (isWaiting === undefined) executor.setDynamicProperty("cb2:executor_wait", false);
        const currWaitTick: number = executor.getDynamicProperty("cb2:executor_wait_tick") as number;
        const nextWaitTick: number = isWaiting && currWaitTick < 80 ? currWaitTick + 1 : 0;
        executor.setDynamicProperty("cb2:executor_wait_tick", nextWaitTick);
        let methodOption;
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
            executor.setDynamicProperty("cb2:executor_wait", false);
            let setRot;
            methodOption = { volume: 1, pitch: 1.2 };
            dimension.playSound("random.explode", executor.location, methodOption);
            if (!halfHealth) {
                setRot = { x: rot.x + (rot.z * 0.2), y: rot.y, z: rot.z + (-rot.x * 0.2) };
                summonLine(option, setRot);
                setRot = { x: rot.x + (-rot.z * 0.2), y: rot.y, z: rot.z + (rot.x * 0.2) };
                summonLine(option, setRot);
            } else {
                summonLine(option, rot);
                setRot = { x: rot.x + (rot.z * 0.5), y: rot.y, z: rot.z + (-rot.x * 0.5) };
                summonLine(option, setRot);
                setRot = { x: rot.x + (-rot.z * 0.5), y: rot.y, z: rot.z + (rot.x * 0.5) };
                summonLine(option, setRot);
            }
        } else {
            methodOption = { amplifier: 255, showParticles: false };
            executor.addEffect("slowness", 40, methodOption);
            executor.playAnimation("animation.crystal_executor.cluster_center");
            await sleep(30);
            executor.setDynamicProperty("cb2:executor_wait", false);
            methodOption = { volume: 1, pitch: 0.8 };
            dimension.playSound("random.explode", executor.location, methodOption);
            summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 2, 8, "right");
            summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 4, 16, "left");
            if (halfHealth) summonCircle(executor.location, dimension, "cb2:crystal_spike_executor", 6, 24, "right");
        };
    }
}