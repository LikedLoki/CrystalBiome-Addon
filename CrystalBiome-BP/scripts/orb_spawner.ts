import { Dimension, EntityDamageCause, EntityDieAfterEvent, EntityHurtBeforeEvent, system, world } from "@minecraft/server";
import { sleep } from "./other";
import { crystalSpawnFn } from "./crystal-spawn-fn";
import { Color } from "./crystal-biome";

export const orbSpawnerFall = (event: EntityHurtBeforeEvent) => {
    const { hurtEntity, damageSource } = event;
    if (hurtEntity.typeId !== "cb2:orb_spawner" || damageSource.cause !== EntityDamageCause.fall) return;
    const { dimension } = hurtEntity;
    event.cancel = true;
    system.run(async () => {
        for (let i = 0; i < (Math.random() * 3 | 0) + 1; i++) {
            dimension.spawnParticle("cb2:crystal_king_tp_particle", hurtEntity.location);
            const radius = 16;
            const dx = Math.random() * (radius * 2) - radius;
            const dz = Math.random() * (radius * 2) - radius;
            const { x, y, z } = hurtEntity.location;
            hurtEntity.teleport({ x: x + dx, y: y, z: z + dz })
            await sleep(Math.random() * 10 | 0);
        }
    })
}

const spawnOffset = [{ dx: 2, dz: 0 }, { dx: 0, dz: 2 }, { dx: -2, dz: 0 }, { dx: 0, dz: -2 }]
let dimension!: Dimension;
system.run(() => dimension = world.getDimension("cb2:crystal_horizon"))
export const orbSpawnerTimeline = (a: Dimension) => {
    const spawners = dimension.getEntities({ type: "cb2:orb_spawner" });
    for (const spawner of spawners) {
        const times = +(spawner.getDynamicProperty("cb2:times") || 0) || 0;
        if (times < 80) {
            spawner.setDynamicProperty("cb2:times", times + 1);
            continue;
        }
        spawner.setDynamicProperty("cb2:times", 0);
        const hasPlayer = dimension.getPlayers({ location: spawner.location, maxDistance: 64 }).length !== 0;
        if (!hasPlayer) continue;

        const reachLimit = dimension.getEntities({ tags: [`cb2:orb_spawner_${spawner.id}`] }).length >= 2;
        if (reachLimit) continue;

        (async () => {
            spawner.playAnimation("animation.orb_spawner.spawn")
            await sleep(10)
            for (const { dx, dz } of spawnOffset) {
                const { x, y, z } = spawner.location;
                const selectColor = Color[["blue", "red", "green", "yellow"][Math.random() * 4 | 0]]
                crystalSpawnFn(dimension, "cb2:crystal_guard", { x: x + dx, y: y, z: z + dz }, selectColor, true, false).addTag(`cb2:orb_spawner_${spawner.id}`)
            }
        })()
    }
}