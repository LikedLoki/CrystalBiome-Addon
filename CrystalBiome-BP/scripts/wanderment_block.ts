import { Dimension, Entity, EntitySpawnAfterEvent, Vector3, world, MolangVariableMap, EntityDamageCause } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn"

class AttackAdmin {
    static pillarAttack(entity: Entity, dimension: Dimension): void {
        const vars: MolangVariableMap = new MolangVariableMap();
        vars.setColorRGB("variable.color", { red: 1, green: 0.2, blue: 0.2 });
        dimension.spawnParticle("cb2:wanderment_block_pillar", entity.location, vars);
        dimension.playSound("firework.large_blast", entity.location, {volume: 2, pitch: 0.8 });
        const enemies: Entity[] | [] = dimension.getEntities({
            "location": entity.location,
            "maxDistance": 4,
            "excludeFamilies": ["crystal"]
        })
        for (let dataI = 0, lengI = enemies.length; dataI < lengI; dataI++) {
            const enemy: Entity = enemies[dataI];
            enemy.applyDamage(4, { cause: EntityDamageCause.entityAttack, damagingEntity: entity });
            enemy.addEffect("levitation", 10, { amplifier: 16 })
        }
        entity.remove();
    }
    static summonAttack(entity: Entity, dimension: Dimension): void {
        crystalSpawnFn(dimension, "cb2:crystal_wander", entity.location, ["blue", "red", "green", "yellow"][Math.random() * 4 | 0] as SettingColor)
            .addTag("cb2:under_wanderment");
        entity.remove();
    }
}

export function wandermentBlockTimeLine(dimension: Dimension): void {
    const wandermentBlocks: Entity[] | [] = dimension.getEntities({
        "type": "cb2:wanderment_block"
    });
    for (let dataI = 0, lengI = wandermentBlocks.length; dataI < lengI; dataI++) {
        const wandermentBlock: Entity = wandermentBlocks[dataI];
        let tick: number = wandermentBlock.getDynamicProperty("cb2:tick") as number | undefined ?? 0;
        tick++;
        wandermentBlock.setDynamicProperty("cb2:tick", tick);
        const getTimer: number = wandermentBlock.getDynamicProperty("cb2:timer") as number;
        const gradation: number = getTimer / 4;
        const vars: MolangVariableMap = new MolangVariableMap();
        if (wandermentBlock.hasTag("cb2:pillar")) vars.setColorRGB("variable.color", { red: 1, green: gradation / tick, blue: gradation / tick });
        else if (wandermentBlock.hasTag("cb2:summon")) vars.setColorRGB("variable.color", { red: gradation / tick, green: 1, blue: gradation / tick });
        const { x, y, z } = wandermentBlock.location;
        dimension.spawnParticle("cb2:wanderment_block_inside", { x: x, y: y + 1, z: z }, vars);
        if (tick < getTimer) continue;
        if (wandermentBlock.hasTag("cb2:pillar")) AttackAdmin.pillarAttack(wandermentBlock, dimension);
        else if (wandermentBlock.hasTag("cb2:summon")) AttackAdmin.summonAttack(wandermentBlock, dimension);
    }
}