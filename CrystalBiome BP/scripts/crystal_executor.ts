import { Dimension, Entity, system, Vector3 } from "@minecraft/server";
import { sleep, summonLine, summonLineOption } from "./other";


export async function executorTimeLine(dimension: Dimension): Promise<void> {
    const randomLeng: number[] = [80, 120, 160];
    const executors: Entity[] | [] = dimension.getEntities({
        "type": "cb2:crystal_executor"
    });
    for (let i = 0; i < executors.length; i++) {
        const hasEnemy: boolean = dimension.getEntities({
            "location": executors[i].location,
            "maxDistance": 16,
            "excludeFamilies": ["crystal"]
        }).length > 0;
        if (!hasEnemy) continue;
        let timeout: number = executors[i].getDynamicProperty("cb2:bosstick_timeout") as number ?? 0;
        let bosstick: number = executors[i].getDynamicProperty("cb2:bosstick") as number ?? 0;
        if (bosstick === 0 || timeout === 0) timeout = randomLeng[Math.floor(Math.random() * randomLeng.length)];
        executors[i].setDynamicProperty("cb2:bosstick_timeout", timeout)
        bosstick++; executors[i].setDynamicProperty("cb2:bosstick", bosstick);
        if (bosstick < timeout) return;
        if (Math.random() < 0.5) {
            if (executors[i].getDynamicProperty("cb2:wait") ?? false) continue;
            executors[i].playAnimation("animation.crystal_executor.cluster_attack");
            executors[i].setDynamicProperty("cb2:wait", true);
            await sleep(20);
            const rot: Vector3 = executors[i].getViewDirection();
            const option: summonLineOption = {
                "amount": 24,
                "dimension": dimension,
                "entityId": "cb2:crystal_spike_executor",
                "interval": 1,
                "firstSpace": 2,
                "location": executors[i].location,
                "per": 1
            };
            executors[i].setDynamicProperty("cb2:wait", false);
            const rightRot = {
                x: rot.x + (rot.z * 0.5),
                y: rot.y,
                z: rot.z + (-rot.x * 0.5)
            };
            const leftRot = {
                x: rot.x + (-rot.z * 0.5),
                y: rot.y,
                z: rot.z + (rot.x * 0.5)
            };
            summonLine(option, rot);
            summonLine(option, rightRot);
            summonLine(option, leftRot);
            executors[i].setDynamicProperty("cb2:bosstick", 0);
        } else {
            if (executors[i].getDynamicProperty("cb2:wait") ?? false) continue;
            executors[i].playAnimation("animation.crystal_executor.cluster_center");
            executors[i].setDynamicProperty("cb2:wait", true);
            await sleep(30);
            const rot: Vector3 = executors[i].getViewDirection();
            const option: summonLineOption = {
                "amount": 24,
                "dimension": dimension,
                "entityId": "cb2:crystal_spike_executor",
                "interval": 1,
                "firstSpace": 2,
                "location": executors[i].location,
                "per": 1
            };
            executors[i].setDynamicProperty("cb2:wait", false);
            const attackRot: Record<string, Vector3> = {
                "right": {
                    x: rot.z, y: rot.y, z: -rot.x
                },
                "left": {
                    x: -rot.z, y: rot.y, z: rot.x
                },
                "back": {
                    x: -rot.x, y: rot.y, z: -rot.z
                }
            }
            summonLine(option, rot);
            summonLine(option, attackRot.right);
            summonLine(option, attackRot.left);
            summonLine(option, attackRot.back);
            executors[i].setDynamicProperty("cb2:bosstick", 0);
        }
    }
}