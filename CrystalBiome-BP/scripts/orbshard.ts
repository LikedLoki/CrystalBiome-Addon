import { Block, BlockCustomComponent, Dimension, system, Vector3, Entity, MolangVariableMap, VectorXZ, BlockComponentOnPlaceEvent, BlockComponentTickEvent, BlockComponentBlockBreakEvent } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn";
import { CrystColor, GuardWonderId } from "./crystal-biome";

type OrbShardTypeId = "cb2:orbshard";
type OrbShardEntity = Entity & { "typeId": OrbShardTypeId };
type Layer = "above" | "below";

const offsetMap = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }, { x: 1, z: 1 }, { x: -1, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }
] as const;
const entityList: GuardWonderId[] = ["cb2:crystal_guard", "cb2:crystal_wander"];
const colorList: CrystColor[] = ["red", "green", "blue", "yellow"]

/**
 * - OrbShardEntity型として、cb2:orbshardの配列、もしくは空の配列を返す。
 */
const getOrbShard = (dimension: Dimension, { x, y, z }: Vector3): OrbShardEntity[] | [] => dimension.getEntities(
    {
        "location": { x: x, y: y - 0.5, z: z },
        "type": "cb2:orbshard",
        "maxDistance": 1
    }
) as OrbShardEntity[] | [];

/**
 * - getOrbShard()が偽なら、新しくcb2:orbshardを召喚する。
 * - つまり、何らかの理由でcb2:orbshardが消えていたら補充する。
 */
const orbSet = ({ dimension, block: { location } }: BlockComponentOnPlaceEvent | BlockComponentTickEvent): void => {
    const shardExists: boolean = getOrbShard(dimension, location).length > 0;
    if (!shardExists) dimension.spawnEntity("cb2:orbshard", location);
};

/**
 * - このブロックが、同時に召喚できるエンティティの数に抵触していないかを真偽値で返す。
 */
const isLimited = (dimension: Dimension, { x, y, z }: Vector3): boolean => dimension.getEntities(
    {
        "location": { x: x, y: y, z: z },
        "maxDistance": 128,
        "tags": [`cb2:orbshard_${x}=${y}=${z}`]
    }
).length >= 6;

/**
 * - offsetMapと、第三引数のlayerに基づいた範囲で空気ブロックの座標を抜き出し返す。
 */
const getAirLayer = (dimension: Dimension, { x, y, z }: Vector3, layer: Layer): Vector3[] | undefined => {
    const airList: Vector3[] = [];
    for (const dataI of offsetMap) {
        const searchLoc: Vector3 = { x: x + dataI.x, y: y + (layer === "above" ? 0 : -1), z: z + dataI.z }
        if (dimension.getBlock(searchLoc)?.isAir) airList.push(searchLoc);
    }
    return airList.length > 0 ? airList : undefined;
};

/**
 *  - 始点(mainOrigin)の条件を通過した場合の処理。
 *  - 受け取った情報から適当に選定して召喚する。
*/
const ifConditionPass = (dimension: Dimension, block: Block, airList: Vector3[]): void => {
    const selectLoc: Vector3 = airList[Math.random() * airList.length | 0];
    const selectEntity: GuardWonderId = entityList[Math.random() * 2 | 0];
    const selectColor: CrystColor = colorList[Math.random() * 4 | 0];
    const { x, y, z }: Vector3 = block.location;
    crystalSpawnFn(dimension, selectEntity, selectLoc, selectColor, true).addTag(`cb2:orbshard_${x}=${y}=${z}`);
};

/**
 * - 時間ごとに実行される処理の始点。
 * - スポーン数の上限値か、そもそも召喚用の空間はあるのかを確かめる。
 */
const mainOrigin = ({ dimension, block }: BlockComponentTickEvent): void => {
    const lowerList: Vector3[] | undefined = getAirLayer(dimension, block.location, "below");
    const upperList: Vector3[] | undefined = lowerList ? undefined : getAirLayer(dimension, block.location, "above");
    const airList: Vector3[] | undefined = lowerList ? lowerList : upperList;
    const canSpawn: boolean =
        !isLimited(dimension, block.location) &&
        !!airList;
    if (canSpawn) ifConditionPass(dimension, block, airList!);
};

/**
 * - ブロック破壊時の処理。
 * - 効果音と演出、最後にこのブロックが召喚したエンティティを消去する。
 */
const shardBreak = ({ dimension, block }: BlockComponentBlockBreakEvent): void => {
    dimension.spawnParticle("cb2:orbshard_break_particle", block.center());
    dimension.playSound("crystal.break", block.center(), { pitch: 0.8 });
    const { x, y, z }: Vector3 = block.location;
    const enemyList: Entity[] | [] = dimension.getEntities({
        location: block.location,
        maxDistance: 128,
        tags: [`cb2:orbshard_${x}=${y}=${z}`]
    }) || [];
    if (enemyList.length > 0) enemyList.forEach(data => data.remove());
}


export const OrbShard: BlockCustomComponent = {
    onPlace(event) {
        orbSet(event);
    },
    onTick(event) {
        orbSet(event)
        mainOrigin(event);
    },
    onBreak(event) {
        shardBreak(event);
    }
}