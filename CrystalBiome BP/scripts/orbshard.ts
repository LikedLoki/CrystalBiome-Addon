import { Block, BlockCustomComponent, Dimension, system, VanillaEntityIdentifier, Vector3, Entity, MolangVariableMap, ServerMessageAfterEventSignal, VectorXZ } from "@minecraft/server";
import { CrystalSpawn, getBlocks } from "./other";

/**cb2:orbshardがおおまかに同じ座標にいないなら、cb2:orbshardを召喚する。 */
function orbSpawn(block: Block, dimension: Dimension): void {
    const hasOrbshard: boolean = dimension.getEntities({
        location: block.center(),
        maxDistance: 1,
        type: "cb2:orbshard"
    }).length > 0;
    const hasOrbshardt: number = dimension.getEntities({
        location: block.center(),
        maxDistance: 0.1,
        type: "cb2:orbshard"
    }).length;
    console.log(hasOrbshardt)
    if (hasOrbshard) return;
    const { x, y, z }: Vector3 = block.center();
    dimension.spawnEntity("cb2:orbshard" as VanillaEntityIdentifier, { x: x, y: y - 0.5, z: z });
};

const offsetMap: VectorXZ[] = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }, { x: 1, z: 1 }, { x: -1, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }
];
const OrbShard: BlockCustomComponent = {
    onPlace({ block, dimension }) {
        orbSpawn(block, dimension);
    },
    onTick({ block, dimension }) {
        orbSpawn(block, dimension);
        const { x, y, z }: Vector3 = block.location;
        const hasLimit: boolean = dimension.getEntities({
            location: block.location,
            maxDistance: 128,
            tags: [`cb2:orbshard_${x}=${y}=${z}`]
        }).length >= 6;
        if (hasLimit) return;
        const lowerBlocks: Block[] | [] = getBlocks(offsetMap, 0, block.location, dimension);
        const upperBlocks: Block[] | [] | undefined = lowerBlocks.length === 0 ? getBlocks(offsetMap, -1, block.location, dimension) : undefined;
        if (lowerBlocks.length === 0 && (upperBlocks?.length === 0 || !upperBlocks)) return;
        const layerBlocks: Block[] | undefined = lowerBlocks.length === 0 ? upperBlocks : lowerBlocks;
        if (!layerBlocks) return;
        const selectVector: Vector3 = layerBlocks[Math.floor(Math.random() * layerBlocks.length)].center();
        const selectEntity: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
        CrystalSpawn(selectEntity, selectVector, dimension, `cb2:orbshard_${x}=${y}=${z}`);
    },
    onBreak({ block, dimension }) {
        dimension.spawnParticle("cb2:orbshard_break_particle", block.center());
        dimension.playSound("crystal.break", block.center(), { pitch: 0.8 });
        const { x, y, z }: Vector3 = block.location;
        const enemyList: Entity[] | [] = dimension.getEntities({
                location: { x: x, y: y, z: z },
                maxDistance: 128,
                tags: [`cb2:orbshard_${x}=${y}=${z}`]
            }) || [];
        if (enemyList.length === 0) return;
        enemyList.forEach(data => data.remove());
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:orbshard", OrbShard);
});
