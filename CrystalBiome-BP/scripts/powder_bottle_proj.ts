import { Dimension, Entity, EntityDamageCause, ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, Vector3 } from "@minecraft/server";
import { Color, CrystColor, particleColor } from "./crystal-biome"

type PowderBottleProj = Entity & { typeId: typeof powderBottleList[number] };

const powderBottleList = [
    "cb2:powder_bottle_blue_proj",
    "cb2:powder_bottle_red_proj",
    "cb2:powder_bottle_green_proj",
    "cb2:powder_bottle_yellow_proj"
] as const;

const isProj = (entity: Entity): entity is PowderBottleProj => powderBottleList.includes(entity.typeId as any);

type Argument = ProjectileHitBlockAfterEvent | ProjectileHitEntityAfterEvent;
export const PowderBottoleProj = ({ dimension, location, projectile }: Argument) => {
    if (!isProj(projectile)) return;
    const color = projectile.typeId.split("_")[2] as CrystColor;
    dimension.playSound("random.glass", location);
    dimension.playSound("break.amethyst_block", location);
    particleColor.setColorRGB("variable.color", Color[color]);
    dimension.spawnParticle("cb2:crystal_particle_pop", location, particleColor);
    dimension.spawnEntity("cb2:powder_area_cloud", location).setDynamicProperty("cb2:color", color);
};

type PowderAreaCloud = Entity & { typeId: "cb2:powder_area_cloud" };

const getAreaCloud = (dimension: Dimension): PowderAreaCloud[] =>
    dimension.getEntities({ type: "cb2:powder_area_cloud" }) as PowderAreaCloud[];

const configMap = {
    "blue": {
        times: 120,
        particle: "cb2:powder_area_cloud_blue_particle",
        fn: (dimension: Dimension, location: Vector3, source: Entity) => {
            const entities = dimension.getEntities({ location, maxDistance: 4, excludeTypes: ["cb2:powder_area_cloud"] });
            for (const entity of entities) entity.applyDamage(2, { cause: EntityDamageCause.magic });
        }
    },
    "red": {
        times: 10,
        particle: "cb2:powder_area_cloud_red_particle",
        fn: (dimension: Dimension, location: Vector3, source: Entity) => {
            const entities = dimension.getEntities({ location, maxDistance: 4, excludeTypes: ["cb2:powder_area_cloud"] });
            for (const entity of entities) entity.applyDamage(8, { damagingEntity: source, cause: EntityDamageCause.magic });
        }
    },
    "green": {
        times: 120,
        particle: "cb2:powder_area_cloud_green_particle",
        fn: (dimension: Dimension, location: Vector3, source: Entity) => {
            const entities = dimension.getEntities({ location, maxDistance: 6, excludeTypes: ["cb2:powder_area_cloud"] });
            for (const entity of entities) {
                const entityPos = entity.location;
                const dx = entityPos.x - location.x;
                const dy = entityPos.y - location.y;
                const dz = entityPos.z - location.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (distance === 0) return;

                const power = 0.05;
                const impulseVector = {
                    x: -(dx / distance) * power,
                    y: -(dy / distance) * power,
                    z: -(dz / distance) * power
                };
                entity.applyImpulse(impulseVector);
            }
        }

    },
    "yellow": {
        times: 120,
        particle: "cb2:powder_area_cloud_yellow_particle",
        fn: (dimension: Dimension, location: Vector3, source: Entity) => {
            const entities = dimension.getEntities({ location, maxDistance: 6, excludeTypes: ["cb2:powder_area_cloud"] });
            for (const entity of entities) {
                entity.applyImpulse({ x: 0, y: 0.2, z: 0 });
            }
        }
    }
} as const;

export const PowderAreaCloud = (dimension: Dimension) => {
    const powderAreaClouds: PowderAreaCloud[] = getAreaCloud(dimension);
    for (const pac of powderAreaClouds) {
        try {
        const color = pac.getDynamicProperty("cb2:color") as CrystColor;
        const times: number = +(pac.getDynamicProperty("cb2:times") || 0);
        const config = configMap[color];
        if (times <= config.times) {
            particleColor.setColorRGB("variable.color", Color[color]);
            if (color === "red") { if (times === 0) dimension.spawnParticle(config.particle, pac.location, particleColor); }
            else dimension.spawnParticle(config.particle, pac.location, particleColor);
            config.fn(dimension, pac.location, pac);
            pac.setDynamicProperty("cb2:times", times + 1);
            continue;
        }
        pac.remove();
    }
        catch(_) {
            continue;
        }
    }
}