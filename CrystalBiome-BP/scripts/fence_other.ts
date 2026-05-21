import { PlayerPlaceBlockAfterEvent, world, Block, Dimension, Vector3, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { FenceAdmin } from "./fence.js";
world.afterEvents.playerPlaceBlock.subscribe(({ block, dimension }) => {
    if (block.hasTag("cb2:is_fence")) return;
    FenceAdmin.updateNearby(block, dimension);
});
world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
    if (block.hasTag("cb2:is_fence")) return;
    FenceAdmin.updateNearby(block, dimension);
});
