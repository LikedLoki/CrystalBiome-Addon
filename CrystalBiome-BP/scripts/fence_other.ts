import { PlayerPlaceBlockAfterEvent, world, Block, Dimension, Vector3, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { FenceAdmin } from "./fence.js";
export const fenceNearby = (dimension: Dimension, block: Block) => {
    if (block.hasTag("cb2:is_fence")) return;
    FenceAdmin.updateNearby(block, dimension);
};