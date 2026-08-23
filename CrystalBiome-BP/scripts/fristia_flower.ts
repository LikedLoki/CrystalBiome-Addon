import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent, VectorXZ, CustomComponentParameters } from "@minecraft/server";
import { Color, particleColor } from "./crystal-biome";

const offset = [
    { dx: 1, dz: 1, facing: "north" }, { dx: 1, dz: -1, facing: "west" }, { dx: -1, dz: 1, facing: "east" }, { dx: -1, dz: -1, facing: "south" }
] as const;

export const FristiaFlower: BlockCustomComponent = {
    onRandomTick({ dimension, block }): void {
        if (!block.permutation.getState("cb2:can_grow" as any)) return;
        if (block.below()?.typeId !== "cb2:fertile_crystal_block") return;
        const nowGrowthLevel: number = block.permutation.getState("cb2:growth" as any);
        if (nowGrowthLevel < 3) {
            block.setPermutation(block.permutation.withState("cb2:growth" as any, nowGrowthLevel + 1));
            return;
        }
        block.setType("cb2:grown_fristia_flower")
        particleColor.setColorRGB("variable.color", Color.blue)
        dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor)
        const { x, y, z } = block.location;
        for (const { dx, dz, facing } of offset) {
            const targetLoc: Vector3 = { x: x + dx, y: y, z: z + dz }
            const fetchedBlock = dimension.getBlock(targetLoc);
            if (!fetchedBlock?.isAir) continue
            dimension.setBlockType(targetLoc, "cb2:fristia_flower")
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
    }
};