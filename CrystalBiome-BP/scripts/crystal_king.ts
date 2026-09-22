import { Dimension, Entity, EntityDieAfterEvent, EntityHurtAfterEvent, Player, system, Vector3, world, World } from "@minecraft/server";
import { sleep } from "./other";
import { crystalSpawnFn } from "./crystal-spawn-fn";
import { Color, particleColor } from "./crystal-biome";

export const crystalKingHealthInterlocking = (event: EntityHurtAfterEvent) => {
    const { hurtEntity, damage } = event;
    if (hurtEntity.typeId !== "cb2:crystal_king") return;
    const health = hurtEntity.dimension.getEntities({ type: "cb2:crystal_king_health" })[0].getComponent("minecraft:health");
    if (!health) return;
    health.setCurrentValue(health.currentValue - damage);
}

class CrystalKing {
    dimension: Dimension;
    entity: Entity;
    constructor(entity: Entity) {
        this.dimension = entity.dimension;
        this.entity = entity;
    }
    get times(): number {
        return +(this.entity.getDynamicProperty("cb2:times") || 0);
    }
    addTimes() {
        this.entity.setDynamicProperty("cb2:times", this.times + 1);
    }

}

function getDirection(a: Vector3, b: Vector3): Vector3 {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;

    const length = Math.hypot(dx, dy, dz);

    if (length === 0) {
        return { x: 0, y: 0, z: 0 };
    }

    return {
        x: dx / length,
        y: dy / length,
        z: dz / length,
    };
}
const vectorLength = (vector: Vector3): number => {
    const { x, y, z } = vector;
    return Math.sqrt(x * x + y * y + z * z)
}
const vectorNormalize = (vector: Vector3): Vector3 => {
    const length = vectorLength(vector);
    const { x, y, z } = vector;
    return { x: x / length, y: y / length, z: z / length };
}
const vectorCross = (vectorI: Vector3, vectorII: Vector3): Vector3 => {
    const { x: ax, y: ay, z: az } = vectorI
    const { x: bx, y: by, z: bz } = vectorII
    return { x: ay * bz - az * by, y: az * bx - ax * bz, z: ax * by - ay * bx }
}

const shotPorjectile = (dimension: Dimension, kingLocation: Vector3, playerLocation: Vector3) => {
    const { x, y, z } = kingLocation;
    const { x: dx, y: dy, z: dz } = getDirection(kingLocation, playerLocation);
    const projectle = dimension.spawnEntity("cb2:crystalshard_proj", { x: x + dx, y: y + 1 + dy, z: z + dz }, { "spawnEvent": `cb2:color_${["blue", "red", "green", "yellow"][Math.random() * 4 | 0]}` });
    projectle.applyImpulse({ x: dx, y: dy, z: dz });
}
const multishootProjectileI = async (dimension: Dimension, king: Entity, player: Entity) => {
    const { x, y, z } = king.location;
    const direction = king.getViewDirection();
    const { x: rx, z: rz } = vectorNormalize(vectorCross(direction, { x: 0, y: 1, z: 0 }));
    const { x: lx, z: lz } = vectorNormalize(vectorCross({ x: 0, y: 1, z: 0 }, direction));
    const range = Math.random() * 4 + 1 | 0
    for (const player of dimension.getPlayers()) player.playSound("random.pop", { "pitch": 0.5 });
    shotPorjectile(dimension, { x: x, y: y + 1, z: z }, player.location);
    shotPorjectile(dimension, { x: x + rx * range, y: y + 1, z: z + rz * range }, player.location);
    shotPorjectile(dimension, { x: x + lx * range, y: y + 1, z: z + lz * range }, player.location);
    shotPorjectile(dimension, { x: x + rx * (range * 2), y: y + 1, z: z + rz * (range * 2) }, player.location);
    shotPorjectile(dimension, { x: x + lx * (range * 2), y: y + 1, z: z + lz * (range * 2) }, player.location);
};
const multishootProjectileII = async (dimension: Dimension, king: Entity, player: Entity) => {
    const { x, y, z } = king.location;
    const direction = king.getViewDirection();
    const { x: rx, z: rz } = vectorNormalize(vectorCross(direction, { x: 0, y: 1, z: 0 }));
    const { x: lx, z: lz } = vectorNormalize(vectorCross({ x: 0, y: 1, z: 0 }, direction));
    const range = 2
    for (const player of dimension.getPlayers()) player.playSound("random.pop", { "pitch": 0.5 });
    shotPorjectile(dimension, { x: x + rx * range, y: y + range, z: z + rz * range }, player.location);
    shotPorjectile(dimension, { x: x + lx * range, y: y + range, z: z + lz * range }, player.location);
    shotPorjectile(dimension, { x: x, y: y + range * 2, z: z }, player.location);
    shotPorjectile(dimension, { x: x + rx * range, y: y + range * 3, z: z + rz * range }, player.location);
    shotPorjectile(dimension, { x: x + lx * range, y: y + range * 3, z: z + lz * range }, player.location);
};
const summonSpikesI = async (dimension: Dimension, location: Vector3) => {
    for (let n = 0; n < 64; n++) {
        await sleep(1);
        for (let r = 1; r < 8; r++) {
            const angle = (r / 8) * 2 * Math.PI;
            const x = location.x + Math.cos(angle) * n;
            const z = location.z + Math.sin(angle) * n;
            dimension.spawnEntity("cb2:crystal_spike_orb", { x, y: location.y, z });
        }
    }
}
const summonSpikesII = async (dimension: Dimension, location: Vector3) => {
    for (let n = 16; n >= 0; n--) {
        await sleep(2);
        for (let r = 1; r < 8; r++) {
            const angle = (r / 8) * 2 * Math.PI;
            const x = location.x + Math.cos(angle) * n;
            const z = location.z + Math.sin(angle) * n;
            dimension.spawnEntity("cb2:crystal_spike_orb", { x, y: location.y, z });
        }
    }
}
const summonGuards = (dimension: Dimension, location: Vector3) => {
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * 2 * Math.PI;
        const x = location.x + Math.cos(angle) * 3;
        const z = location.z + Math.sin(angle) * 3;
        crystalSpawnFn(dimension, "cb2:crystal_guard", { x, y: location.y, z }, Color[["blue", "red", "green", "yellow"][Math.random() * 4 | 0]], true, false).addTag("cb2:guard_under_king");
    }
}
const players = (dimension: Dimension) => dimension.getPlayers();
const crystKingStand = (dimension: Dimension) => dimension.getEntities({ type: "cb2:crystal_king_stand" })[0];
const multishootProjectile = async (dimension: Dimension, kingLocation: Vector3, playerLocation: Vector3) => {
    shotPorjectile(dimension, kingLocation, playerLocation)
    await sleep(2);
    shotPorjectile(dimension, kingLocation, playerLocation)
    await sleep(2);
    shotPorjectile(dimension, kingLocation, playerLocation)
    await sleep(2);
    shotPorjectile(dimension, kingLocation, playerLocation)
};
const animate = async (entity: Entity, id: string, time_s?: number) => {
    system.run(async () => {
        await sleep(1);
        time_s === undefined ? entity.playAnimation(id) : entity.playAnimation(id, { "blendOutTime": time_s })
    });
}
const orbspawnerSummonOffset = [
    { dx: 4, dz: 4 }, { dx: -4, dz: 4 }, { dx: 4, dz: -4 }, { dx: -4, dz: -4 }
] as const;
export const crystalKingPhase1 = (dimension: Dimension, tick: number) => {
    if (tick % 20 === 0) {
        const hpEntity = dimension.getEntities({ type: "cb2:crystal_king_health" })[0];
        const defeatCondition = hpEntity.getComponent("minecraft:health")?.currentValue === 1;
        if (defeatCondition) {
            world.setDynamicProperty("cb2:ch_tick", 0)
            world.setDynamicProperty("cb2:ch_chapter", 2)
            return
        }
    }
    if (tick % 60 === 0) {
        const crystalKingStand = crystKingStand(dimension)
        particleColor.setColorRGB("variable.color", Color.blue);
        dimension.spawnParticle("cb2:crystal_particle_pop", crystalKingStand.location, particleColor);
        (async () => {
            await sleep(20)
            const player = players(dimension)[0];
            multishootProjectile(dimension, crystalKingStand.location, player.location);
        })()
    }
    if (tick % 80 === 0) {
        const crystalKingStand = crystKingStand(dimension)
        const { x, z } = players(dimension)[0].location;
        const offset = { dx: Math.random() * 32 - 16, dz: Math.random() * 32 - 16 } as const;
        const outLocation: Vector3 = { x: x + offset.dx, y: 24, z: z + offset.dz };
        dimension.spawnParticle("cb2:crystal_king_tp_particle", crystalKingStand.location);
        crystalKingStand.teleport(outLocation)
        dimension.spawnParticle("cb2:crystal_king_tp_particle", outLocation)
    }
    if (tick % 160 === 0) {
        const canSpawn = dimension.getEntities({ type: "cb2:orb_spawner" }).length < 2;
        if (canSpawn) {
            const crystalKingStand = crystKingStand(dimension)
            animate(crystalKingStand, "animation.crystal_king.to_battle");
            system.runTimeout(() => {
                for (const { dx, dz } of orbspawnerSummonOffset) {
                    const { x, y, z } = crystalKingStand.location;
                    const spawnLocation: Vector3 = { x: x + dx + Math.random() * 2, y: y, z: z + dz + Math.random() * 2 };
                    dimension.spawnEntity<"cb2:orb_spawner">("cb2:orb_spawner", spawnLocation);
                    particleColor.setColorRGB("variable.color", Color.blue);
                    dimension.spawnParticle("cb2:cbspawn_particle", spawnLocation, particleColor);
                }
                system.runTimeout(() => animate(crystalKingStand, "animation.crystal_king.to_fly", 1024), 20);
            }, 20)
        }
    }
}
export const crystalKingTimeLine = (dimension: Dimension) => {
    const entities = dimension.getEntities({ type: "cb2:crystal_king" });
    for (const entity of entities) {
        if (entity.hasTag("cb2:stop")) continue;
        const king = new CrystalKing(entity);
        if (king.times % 160 === 0) {
            king.entity.addEffect("slowness", 2, { "amplifier": 255 })
            const target = king.entity.target;
            if (!target) continue;
            if (Math.random() < 0.5) {
                (async () => {
                    multishootProjectileI(dimension, king.entity, target);
                    await sleep(10);
                    multishootProjectileI(dimension, king.entity, target);
                    await sleep(10);
                    multishootProjectileI(dimension, king.entity, target);
                })()
            } else {
                (async () => {
                    multishootProjectileII(dimension, king.entity, target);
                    await sleep(10);
                    multishootProjectileII(dimension, king.entity, target);
                    await sleep(10);
                    multishootProjectileII(dimension, king.entity, target);
                })()
            }
        }
        if (king.times % 240 === 0) {
            king.entity.addEffect("slowness", 2, { "amplifier": 255 })
            if (Math.random() < 0.5) {
                summonSpikesI(dimension, king.entity.location);
            } else {
                const target = king.entity.target;
                if (!target) continue;
                summonSpikesII(dimension, target.location);
            }
        }
        if (king.times % 320 === 0) {
            if (dimension.getEntities({ tags: ["cb2:guard_under_king"] }).length <= 2) summonGuards(dimension, king.entity.location);
        }
        king.addTimes();
    }
}