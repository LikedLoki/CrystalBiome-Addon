import { Entity, EntityDamageCause, system, Vector3, world } from "@minecraft/server";
import { Color, particleColor } from "./crystal-biome";

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceBlock, sourceEntity }) => {
    if (id !== "cb2:giant_cluster_attack" && id !== "cb2:giant_strata_attack") return;
    if (!sourceEntity) return;
    const facing = sourceEntity.getViewDirection();
    const { x, y, z } = sourceEntity.location;
    const { x: dx, y: dy, z: dz } = facing;
    const directionGaze: Vector3 = {
        x: x + dx * 4,
        y: y + dy * 4 + 2,
        z: z + dz * 4
    }
    const { dimension } = sourceEntity
    if (id === "cb2:giant_cluster_attack") {
        particleColor.setColorRGB("variable.color", Color.red)
        dimension.spawnParticle("cb2:giant_cluster_attack_particle", directionGaze, particleColor)
        particleColor.setColorRGB("variable.color", Color.yellow)
        dimension.spawnParticle("cb2:giant_cluster_attack_particle", directionGaze, particleColor)
        dimension.playSound("random.explode", directionGaze, { pitch: 0.75 })
        const nearbyEnemies: Entity[] = dimension.getEntities({ excludeFamilies: ["crystal"], maxDistance: 5, location: directionGaze });
        for (const enemy of nearbyEnemies) {
            try {
                enemy.applyDamage(16, { cause: EntityDamageCause.maceSmash, damagingEntity: sourceEntity });
                const { x: eX, y: eY, z: eZ } = enemy.location;
                const { x: dgX, y: dgY, z: dgZ } = directionGaze
                const dx = eX - dgX;
                const dy = eY - dgY;
                const dz = eZ - dgZ;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const power = 1;
                const impulseVector = {
                    x: (dx / distance) * power,
                    y: (dy / distance) * power,
                    z: (dz / distance) * power
                };
                enemy.applyImpulse(impulseVector)
            } catch (e) { }
        }

    } else {
        particleColor.setColorRGB("variable.color", Color.blue)
        dimension.spawnParticle("cb2:giant_strata_attack_particle", directionGaze, particleColor)
        particleColor.setColorRGB("variable.color", Color.green)
        dimension.spawnParticle("cb2:giant_strata_attack_particle", directionGaze, particleColor)
        dimension.playSound("random.explode", directionGaze, { pitch: 0.75 })
        const nearbyEnemies: Entity[] = dimension.getEntities({ excludeFamilies: ["crystal"], maxDistance: 5, location: directionGaze });
        for (const enemy of nearbyEnemies) {
            try {
                enemy.applyDamage(16, { cause: EntityDamageCause.maceSmash, damagingEntity: sourceEntity });
                enemy.applyImpulse({ x: 0, y: 1, z: 0 })
            } catch (e) { }
        }
    }

})