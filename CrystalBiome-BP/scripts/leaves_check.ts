import { system, ItemStack, BlockCustomComponent, Vector3, Block, Dimension } from "@minecraft/server";

interface VectorDXYZ {
    dx: number, dy: number, dz: number
}

const offset: VectorDXYZ[] = [
    { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 }, { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 }, { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 }
];

class LeavesAdmin {
    static nearbyMaxLevel(dimension: Dimension, block: Block): number {
        let maxLevel = 0;
        for (let dataI = 0, lengI = offset.length; dataI < lengI; dataI++) {
            const { x, y, z } = block.location;
            const { dx, dy, dz } = offset[dataI];
            const getBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
            if (!getBlock) continue;
            const nearbyLevel: number = getBlock.typeId === "cb2:crystaloak_leaves_nature" ? getBlock.permutation.getState("cb2:connect_level" as any) : getBlock.typeId === "cb2:crystaloak_log" ? 6 : 0;
            if (nearbyLevel > maxLevel) maxLevel = nearbyLevel;
        }
        return maxLevel;
    }
}

export const CrystaloakLeaves: BlockCustomComponent = {
    onRandomTick({ dimension, block }): void {
        const newPerm: number = LeavesAdmin.nearbyMaxLevel(dimension, block);
        if (newPerm > 0) block.setPermutation(block.permutation.withState("cb2:connect_level" as any, newPerm - 1));
        else {
            dimension.setBlockType(block.location, "minecraft:air");
            const dropItem: ItemStack | undefined = Math.random() < 0.05 ? new ItemStack("cb2:crystal_sapling_item", 1) : undefined;
            if (!dropItem) return;
            dimension.spawnItem(dropItem, block.location);
        }
    },
    onPlace({ dimension, block }): void {
        const newPerm: number = LeavesAdmin.nearbyMaxLevel(dimension, block);
        if (newPerm > 0) block.setPermutation(block.permutation.withState("cb2:connect_level" as any, newPerm));
    }
}