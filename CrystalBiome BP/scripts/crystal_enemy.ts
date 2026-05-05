import { Dimension, Entity, EntitySpawnAfterEvent, VanillaEntityIdentifier, Vector3, world, MolangVariableMap } from "@minecraft/server";
import { CrystalSpawn } from "./other.js"

type crystal = `cb2:${string}`;
type config = { [key: crystal]: { dist: number; limit: number } };

const enemyConfig: config = {
    "cb2:crystal_guard": { dist: 64, limit: 2 },
    "cb2:crystal_wander": { dist: 64, limit: 2 }
};

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    const pass: boolean = (function () { for (const data of Object.keys(enemyConfig)) { if (entity.typeId === `${data}_spawn`) return true; } return false; })();
    if (!pass) return;
    const { location, dimension } = entity;
    const hasPrism: boolean = (dimension.getEntities(
            {
                location: location,
                maxDistance: 128,
                type: "cb2:prismstone_entity"
            }
        ) || [])[0] ? true : false;
    if (hasPrism) { entity.remove(); return; }
    const typeId: crystal = entity.typeId.replace("_spawn", "") as crystal;
    const limitEntity: boolean = dimension.getEntities(
            {
                location: location,
                maxDistance: enemyConfig[typeId].dist,
                type: typeId,
            }
        ).length >= enemyConfig[typeId].limit;
    if (limitEntity) { entity.remove(); return; }
    CrystalSpawn(typeId, location, dimension, null);
    entity.remove();
});