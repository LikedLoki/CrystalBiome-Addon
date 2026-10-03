import { Dimension, Entity, EntitySpawnAfterEvent, Vector3, world, MolangVariableMap, EntityDamageCause } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn"
import { Color, particleColor } from "./crystal-biome";

class AttackAdmin {
    static pillarAttack(entity: Entity, dimension: Dimension): void {
        particleColor.setColorRGB("variable.color", { red: 1, green: 0.2, blue: 0.2 });
        dimension.spawnParticle("cb2:wanderment_block_pillar", entity.location, particleColor);
        dimension.playSound("firework.large_blast", entity.location, {volume: 2, pitch: 0.8 });
        const enemies: Entity[] | [] = dimension.getEntities({
            "location": entity.location,
            "maxDistance": 4,
            "excludeFamilies": ["crystal"]
        })
        for (const enemy of enemies) {
            enemy.applyDamage(4, { cause: EntityDamageCause.entityAttack, damagingEntity: entity });
            enemy.applyImpulse({ x: 0, y: 0.5, z: 0 })
        }
        entity.remove();
    }
    static summonAttack(entity: Entity, dimension: Dimension): void {
        crystalSpawnFn(dimension, "cb2:crystal_wander", entity.location, Color[["blue", "red", "green", "yellow"][Math.random()*4 | 0]], true, true)
        entity.remove();
    }
}

export function wandermentBlockTimeLine(dimension: Dimension): void {
    const wandermentBlocks: Entity[] | [] = dimension.getEntities({
        "type": "cb2:wanderment_block"
    });
    for (const wandermentBlock of wandermentBlocks) {
        let tick: number = wandermentBlock.getDynamicProperty("cb2:tick") as number | undefined ?? 0;
        tick++;
        wandermentBlock.setDynamicProperty("cb2:tick", tick);
        const getTimer: number = wandermentBlock.getDynamicProperty("cb2:timer") as number;
        const gradation: number = getTimer / 4;
        if (wandermentBlock.hasTag("cb2:pillar")) particleColor.setColorRGB("variable.color", { red: 1, green: gradation / tick, blue: gradation / tick });
        else if (wandermentBlock.hasTag("cb2:summon")) particleColor.setColorRGB("variable.color", { red: gradation / tick, green: 1, blue: gradation / tick });
        const { x, y, z } = wandermentBlock.location;
        dimension.spawnParticle("cb2:wanderment_block_inside", { x: x, y: y + 1, z: z }, particleColor);
        if (tick < getTimer) continue;
        if (wandermentBlock.hasTag("cb2:pillar")) AttackAdmin.pillarAttack(wandermentBlock, dimension);
        else if (wandermentBlock.hasTag("cb2:summon")) AttackAdmin.summonAttack(wandermentBlock, dimension);
    }
}