import { system, Vector3, world } from "@minecraft/server";
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
    if (id === "cb2:giant_cluster_attack") {
        particleColor.setColorRGB("variable.color", Color.red)
        sourceEntity.dimension.spawnParticle("cb2:giant_cluster_attack_particle", directionGaze, particleColor)
        particleColor.setColorRGB("variable.color", Color.yellow)
        sourceEntity.dimension.spawnParticle("cb2:giant_cluster_attack_particle", directionGaze, particleColor)
    } else {
        particleColor.setColorRGB("variable.color", Color.blue)
        sourceEntity.dimension.spawnParticle("cb2:giant_strata_attack_particle", directionGaze, particleColor)
        particleColor.setColorRGB("variable.color", Color.green)
        sourceEntity.dimension.spawnParticle("cb2:giant_strata_attack_particle", directionGaze, particleColor)
    }

})