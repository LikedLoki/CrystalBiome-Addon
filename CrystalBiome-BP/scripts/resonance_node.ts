import { Block, BlockCustomComponent, BlockPermutation, Dimension, Entity, Vector3, world } from "@minecraft/server";

type Pattern = keyof typeof fnMap;

const reduceMap: Map<Vector3, Vector3> = new Map();

const targetDirect = (source: Vector3, target: Vector3): Record<"dx" | "dy" | "dz", number> => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dz = target.z - source.z;

    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return {
        dx: dx / length,
        dy: dy / length,
        dz: dz / length
    };
};

const typeMap: Record<string, Pattern> = {
    "cb2:crystal_pillar": "pillar",
    "cb2:refined_crystal_block": "shoot",
    "cb2:refined_red_crystal_block": "shoot",
    "cb2:refined_green_crystal_block": "shoot",
    "cb2:refined_yellow_crystal_block": "shoot"
};

const energyConsume = (block: Block) => {
    const nowEnergy: number = +(block.permutation.getState("cb2:energy" as any) || 0);
    const nextEnergy: number = nowEnergy - 1;
    if (nextEnergy < 1) {
        block.setPermutation(block.permutation
            .withState("cb2:bool_I" as any, false)
            .withState("cb2:energy" as any, 0))
    } else {
        block.setPermutation(block.permutation.withState("cb2:energy" as any, nextEnergy))
    }
}

const fnMap = {
    "pillar": (dimension: Dimension, block: Block, constBlock: Block) => {
        if (!(block.typeId in typeMap) || constBlock.above()?.location === block.location) return;
        const getData = reduceMap.get(constBlock.location);
        if (getData) {
            const getBlock = dimension.getBlock(getData);
            if (!getBlock) {
                reduceMap.delete(constBlock.location);
                return;
            }
            const type: Pattern = typeMap[getBlock.typeId];
            fnMap[type](dimension, getBlock, constBlock);
            return;
        }
        const type: Pattern = typeMap[block.typeId];
        const above: Block | undefined = block.above();
        if (!above) return;
        fnMap[type](dimension, above.isAir && block.typeId !== "cb2:crystal_pillar" ? block : above, constBlock);
        if (type !== "pillar") reduceMap.set(constBlock.location, above.location);
    },
    "shoot": (dimension: Dimension, block: Block) => {
        const target: Entity | undefined = dimension.getEntities({
            "closest": 1,
            "location": block.center(),
            "families": ["monster"],
            "maxDistance": 16
        })[0];
        if (!target) return;
        const direct = targetDirect(block.center(), target.location);
        const { dx, dy, dz } = direct;
        const { x, y, z } = block.center();
        const a: string = block.typeId.replace("cb2:", "").split("_")[1]
        const color: string = `cb2:color_${a === "crystal" ? "blue" : a}`
        const A: Entity = dimension.spawnEntity("cb2:crystalshard_proj", { x: x + dx, y: y, z: z + dz }, {"spawnEvent": color});
        A.applyImpulse({ x: dx, y: dy, z: dz });
    },
    "knock": (dimension: Dimension, block: Block) => {
        world.sendMessage("knock")
    }
} as const;

export const resonanceNode: BlockCustomComponent = {
    "onTick": ({ dimension, block }) => {
        const above: Block | undefined = block.above();
        if (!above || !(above.typeId in typeMap)) return;
        const type: Pattern = typeMap[above.typeId];
        fnMap[type](dimension, above, block);
        energyConsume(block);
    }
}