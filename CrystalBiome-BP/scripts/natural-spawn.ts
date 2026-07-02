import { Dimension, Entity, EntitySpawnAfterEvent, Vector3, world, MolangVariableMap } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn"
import { CrystColor } from "./crystal-biome";

type SpawnerTypeId = keyof typeof enemyMap;
type SpawnerEntity = Entity & { "typeId": SpawnerTypeId };
type CrystalInfo<T extends SpawnerTypeId> = typeof enemyMap[T];

const colorList: CrystColor[] = ["red", "green", "blue", "yellow"]

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

const mainEnd = (entity: Entity): void => entity.remove();

const ifCondPass = (entity: SpawnerEntity, option: CrystalInfo<SpawnerTypeId>): void => {
    const { dimension, location }: SpawnerEntity = entity;
    const selectColor: SettingColor = colorList[Math.random() * 4 | 0];
    crystalSpawnFn(dimension, option.typeId, location, selectColor);
    mainEnd(entity)
}
const ifSpawner = (entity: SpawnerEntity): void => {
    const { dimension, location }: SpawnerEntity = entity;
    const option: CrystalInfo<typeof entity.typeId> = enemyMap[entity.typeId];
    const failedCondition: boolean =
        hasPrism(dimension, location) ||
        isLimited(dimension, location, option);

    if (!failedCondition) ifCondPass(entity, option);
    else mainEnd(entity); 
}

const mainOrigin = ({ entity }: EntitySpawnAfterEvent): void => {
    if (isSpawnerEntity(entity)) ifSpawner(entity);
}

world.afterEvents.entitySpawn.subscribe(event => mainOrigin(event));