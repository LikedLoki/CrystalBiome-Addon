import { Dimension, Entity, EntitySpawnAfterEvent, Vector3, world, MolangVariableMap } from "@minecraft/server";
import { CrystalSpawn, Color } from "./other.js"

type SpawnerTypeId = keyof typeof enemyMap;
type SpawnerEntity = Entity & { "typeId": SpawnerTypeId };
type CrystalInfo<T extends SpawnerTypeId> = typeof enemyMap[T];

const enemyMap = {
    "cb2:crystal_guard_spawn": { typeId: "cb2:crystal_guard", dist: 80, limit: 3 },
    "cb2:crystal_wander_spawn": { typeId: "cb2:crystal_wander", dist: 80, limit: 2 }
} as const;

const isSpawnerEntity = (entity: Entity): entity is SpawnerEntity => entity.typeId in enemyMap;
const hasPrism = (dimension: Dimension, location: Vector3): boolean => dimension.getEntities(
    {
        "location": location,
        "maxDistance": 128,
        "type": "cb2:prismstone_entity"
    }
).length > 0;
const isLimited = (dimension: Dimension, location: Vector3, option: CrystalInfo<SpawnerTypeId>): boolean => dimension.getEntities(
    {
        "location": location,
        "maxDistance": option.dist,
        "type": option.typeId
    }
).length >= option.limit;

const main = ({ entity }: EntitySpawnAfterEvent) => {
    if (!isSpawnerEntity(entity)) {
        entity.remove();
        return;
    }
    const { dimension, location }: SpawnerEntity = entity;
    const option: CrystalInfo<typeof entity.typeId> = enemyMap[entity.typeId];
    const shouldCondition: boolean = 
        hasPrism(dimension, location) ||
        isLimited(dimension, location, option);
        
    if (shouldCondition) {
        entity.remove();
        return;
    }
    const color: Color = ["red", "blue", "green", "yellow"][Math.random() * 4 | 0] as Color;
    CrystalSpawn(option.typeId, location, dimension, color, true);
    entity.remove();
}

world.afterEvents.entitySpawn.subscribe(event => main(event));