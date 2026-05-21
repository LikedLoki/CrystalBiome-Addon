import { Block, Dimension, Entity, MolangVariableMap, system, Vector3, VectorXZ } from "@minecraft/server";
import { sleep, summonCircle, summonLine, summonLineOption, CrystalSpawn } from "./other";

interface BossInfo {
    "timeout": number,
    "currTick": number,
    "wait": boolean,
    "waitTick": number
};

export class WandermentAdmin {
    static #dimension: Dimension;;
    static #randomLeng: number[] = [80, 120, 160];
    static run(dimension: Dimension) {
        this.#dimension = dimension;
        const wanderments: Entity[] | [] = dimension.getEntities({ "type": "cb2:crystal_wanderment" });
        for (let dataI = 0, lengI = wanderments.length; dataI < lengI; dataI++) {
            const wanderment: Entity = wanderments[dataI];
            const hasEnemy: boolean = dimension.getEntities({
                "location": wanderment.location,
                "maxDistance": 16,
                "excludeFamilies": ["crystal"]
            }).length > 0;
            if (!hasEnemy) continue;
            const bossInfo: BossInfo = JSON.parse(wanderment.getDynamicProperty("cb2:boss_info") as string | undefined ?? "{ \"timeout\": 0, \"currTick\": 0, \"wait\": false, \"waitTick\": 0 }");
            const halfHealth: boolean = (wanderment.getComponent("minecraft:health")?.currentValue ?? 0) <= 75;
            const vars: MolangVariableMap = new MolangVariableMap();
            if (halfHealth) {
                const { x, y, z }: Vector3 = wanderment.location;
                vars.setColorRGB("variable.color", Math.random() < 0.5 ? { red: 1, green: 1, blue: 1 } : { red: 0, green: 0, blue: 0 });
                const selectPos: Vector3 = { x: Math.random() * 4 - 2 + x, y: Math.random() + y, z: Math.random() * 4 - 2 + z };
                dimension.spawnParticle("cb2:crystal_particle", selectPos, vars);
                wanderment.addEffect("speed", 10, { amplifier: 0 });
            }
            if (bossInfo.timeout === 0) bossInfo.timeout = halfHealth ? this.#randomLeng[Math.random() * 3 | 0] / 2 : this.#randomLeng[Math.random() * 3 | 0];
            bossInfo.currTick++;
            if (bossInfo.currTick < bossInfo.timeout) {
                wanderment.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
                continue;
            };
            this.#summonBlock(wanderment, bossInfo, halfHealth);
            bossInfo.wait = true;
            wanderment.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
        }
    }
    static async #summonBlock(wanderment: Entity, bossInfo: BossInfo, half: boolean) {
        if (bossInfo.wait && bossInfo.waitTick <= 80) {
            bossInfo.waitTick++;
            wanderment.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
            return;
        } else {
            bossInfo.wait = false;
            bossInfo.waitTick = 0;
        }
        wanderment.playAnimation("animation.crystal_wanderment.summon_block");
        wanderment.addEffect("slowness", 20, { amplifier: 4 });
        await sleep(10);
        const { x, y, z }: Vector3 = wanderment.location;
        for (let i = 0; i < (half ? 3 : 2); i++) {
            const randomLocation: Vector3 = {
                x: x + Math.random() * 12 - 6 | 0,
                y: y,
                z: z + Math.random() * 12 - 6 | 0
            };
            const vars: MolangVariableMap = new MolangVariableMap();
            vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 1 });
            const wandermentBlock: Entity = this.#dimension.spawnEntity("cb2:wanderment_block", randomLocation);
            this.#dimension.playSound("cbspawner_detect", randomLocation);
            this.#dimension.spawnParticle("cb2:cbspawn_particle", randomLocation, vars);
            if (Math.random() < 0.75 || this.#dimension.getEntities({ location: randomLocation, maxDistance: 64, type: "cb2:crystal_wander" }).length >= 8) wandermentBlock.addTag("cb2:pillar");
            else wandermentBlock.addTag("cb2:summon");
            wandermentBlock.setDynamicProperty("cb2:timer", (half ? [20, 40, 80] : [40, 80, 160])[Math.random() * 3 | 0]);
        }
        bossInfo.wait = false;
        bossInfo.timeout = 0;
        bossInfo.currTick = 0;
        wanderment.setDynamicProperty("cb2:boss_info", JSON.stringify(bossInfo));
    }
}