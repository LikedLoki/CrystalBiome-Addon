import { Dimension, Entity, EntitySpawnAfterEvent, Vector3, world, MolangVariableMap } from "@minecraft/server";
import { CrystalSpawn, Color } from "./other.js"

type CrystalTypeId = "cb2:crystal_guard" | "cb2:crystal_wander";
type TrrigerTypeId = `${CrystalTypeId}_spawn`;
type EnemyInfo = { dist: number, limit: number };
type EnemyMap = Record<CrystalTypeId, EnemyInfo>

const enemyMap: Readonly<EnemyMap> = {
    "cb2:crystal_guard": { dist: 64, limit: 2 },
    "cb2:crystal_wander": { dist: 64, limit: 2 }
};
const includeArray = Object.keys(enemyMap).map(data => data + "_spawn") as TrrigerTypeId[];

class naturalSpawnAdmin {
    static regex: RegExp = /^cb2:.*_spawn$/;
    static run(event: EntitySpawnAfterEvent): void {
        const { entity } = event;
        const isPass: boolean = this.isTrigger(entity.typeId);
        if (!isPass) return;
        const { dimension, location } = entity;
        const hasPrism: boolean = dimension.getEntities(
            {
                location: location,
                maxDistance: 128,
                type: "cb2:prismstone_entity"
            }
        ).length > 0;
        if (hasPrism) { entity.remove(); return; }
        const formatId = entity.typeId.replace("_spawn", "");
        if (formatId !== "cb2:crystal_guard" && formatId !== "cb2:crystal_wander") return;
        const enemyInfo: EnemyInfo = enemyMap[formatId];
        const isLimited: boolean = dimension.getEntities(
            {
                location: location,
                maxDistance: enemyInfo.dist,
                type: formatId
            }
        ).length >= enemyInfo.limit;
        if (isLimited) return;
        const color: Color = ["red", "blue", "green", "yellow"][Math.random() * 4 | 0] as Color;
        CrystalSpawn(formatId, location, dimension, color, true);
        entity.remove();
    }
    static isTrigger(typeId: string): boolean {
        return this.regex.test(typeId) && includeArray.includes(typeId as TrrigerTypeId);
    }
}

world.afterEvents.entitySpawn.subscribe(naturalSpawnAdmin.run);