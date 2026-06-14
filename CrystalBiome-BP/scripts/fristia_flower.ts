import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent, VectorXZ, CustomComponentParameters } from "@minecraft/server";

const offset = [
    { dx: 1, dz: 1, facing: "north" }, { dx: 1, dz: -1, facing: "west" }, { dx: -1, dz: 1, facing: "east" }, { dx: -1, dz: -1, facing: "south" }
] as const;

export const FristiaFlower: BlockCustomComponent = {
    onRandomTick({ dimension, block }): void {
        const nowGrowthLevel: number = block.permutation.getState("cb2:growth" as any);
        if (nowGrowthLevel < 3) {
            block.setPermutation(block.permutation.withState("cb2:growth" as any, nowGrowthLevel + 1));
            return;
        }
        for (let dataI = 0; dataI < 4; dataI++) {
            if (Math.random() < 0.5) continue;
            const { x, y, z } = block.location;
            const { dx, dz, facing } = offset[dataI];
            const searchLoc: Vector3 = { x: x + dx, y: y, z: z + dz };
            const getBlock: Block | undefined = dimension.getBlock(searchLoc);
            if (!getBlock || getBlock.typeId !== "minecraft:air") continue;
            dimension.setBlockType(searchLoc, "cb2:fristia_sideflower");
            const setFacing = getBlock.permutation.withState("minecraft:cardinal_direction", facing);
            getBlock.setPermutation(setFacing);
        }
    },
    onBreak({ dimension, block }): void {
        for (let dataI = 0; dataI < 4; dataI++) {
            const { x, y, z } = block.location;
            const { dx, dz, facing } = offset[dataI];
            const diagonalBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
            if (!diagonalBlock || diagonalBlock.permutation.getState("minecraft:cardinal_direction") !== facing) continue;
            dimension.setBlockType(diagonalBlock.location, "minecraft:air");
        }
    }
};
export const FristiaSideFlower: BlockCustomComponent = {
    onRandomTick({ block }): void {
        const growthLevel: number = block.permutation.getState("cb2:growth" as any);
        if (growthLevel >= 1) return;
        block.setPermutation(block.permutation.withState("cb2:growth" as any, growthLevel + 1));
    }
};