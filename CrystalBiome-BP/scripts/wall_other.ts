import { Dimension, Block, PlayerPlaceBlockAfterEvent, world, Vector3, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { WallAdmin } from "./wall.js";
world.afterEvents.playerPlaceBlock.subscribe(({ block, dimension }) => {
    if (block.hasTag("cb2:is_wall")) return;
    WallAdmin.updateNearby(block, dimension);
});
world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
    if (block.hasTag("cb2:is_wall")) return;
    WallAdmin.updateNearby(block, dimension);
});
