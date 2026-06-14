import { Dimension, Block, PlayerPlaceBlockAfterEvent, world, Vector3, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { WallAdmin } from "./wall.js";
export const wallNearby = (dimension: Dimension, block: Block) => {
    if (block.hasTag("cb2:is_wall")) return;
    WallAdmin.updateNearby(block, dimension);
};
