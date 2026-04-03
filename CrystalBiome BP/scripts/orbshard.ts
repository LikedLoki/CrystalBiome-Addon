import { Block, BlockCustomComponent, Dimension, system, VanillaEntityIdentifier, Vector3, Entity, MolangVariableMap, ServerMessageAfterEventSignal } from "@minecraft/server";
import { CrystalSpawn } from "./other";

const offsetMap: { x: number, z: number }[] = [
    { x: 1, z: 0 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }, { x: 1, z: 1 }, { x: -1, z: -1 }
];
function spawn(block: Block, dimension: Dimension) {
    const offset: Vector3 = { x: 0.5, y: 0, z: 0.5 };
    const loc: Vector3 = {
        x: block.location.x + offset.x,
        y: block.location.y + offset.y,
        z: block.location.z + offset.z
    };
    const cbg: Entity[] = dimension.getEntities(
        {
            location: loc,
            maxDistance: 0.1,
            type: "cb2:orbshard"
        }
    );
    if (cbg[0]) return;
    dimension.spawnEntity("cb2:orbshard" as VanillaEntityIdentifier, loc);
}

const small: BlockCustomComponent = {
    onPlace({ dimension, block }) {
        if (!dimension.getBlock(block.location)) return;
        spawn(block, dimension);
    },
    onTick({ dimension, block }) {
        spawn(block, dimension);
        const { x, y, z }: Vector3 = block.location;
        const box: Vector3[] = [];
        for (let I = -1; I <= 0; I++) for (const data of offsetMap) {
            const search: Block | undefined = dimension.getBlock({ x: x + data.x, y: y + I, z: z + data.z });
            if (search?.typeId === "minecraft:air") box.push(search);
        };
        if (!box[0]) return;
        const limitEnemy: boolean = (dimension.getEntities({
            location: block.center(),
            tags: [`cb2:orbshard_${x}=${y}=${z}`]
        }) || []).length >= 6;
        if (!limitEnemy) {
            const select: Vector3 = box[Math.floor(Math.random() * box.length)];
            const entity: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
            CrystalSpawn(entity, select, dimension, `cb2:orbshard_${x}=${y}=${z}`);
        }
    },
    onBreak({ block, dimension }) {
        dimension.spawnParticle("cb2:orbshard_break_particle", block.center());
        dimension.playSound("crystal.break", block.center(), { pitch: 0.8 })
        const { x, y, z }: Vector3 = block.location;
        const enemyList: Entity[] | [] = dimension.getEntities(
            {
                location: { x: x, y: y, z: z },
                maxDistance: 128,
                tags: [`cb2:orbshard_${x}=${y}=${z}`]
            }
        ) || [];
        if (!enemyList[0]) return;
        for (const data of enemyList) {
            data.remove();
        };
    }
};


system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:orbshard", small);
});
