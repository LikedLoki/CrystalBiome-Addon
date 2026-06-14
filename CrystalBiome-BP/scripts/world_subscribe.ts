import { world } from "@minecraft/server";
import { furnaceCancel } from "./crystal_furnace_cancel";
import { wallNearby } from "./wall_other";

world.afterEvents.playerBreakBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
    furnaceCancel(dimension, block);
})
world.afterEvents.playerPlaceBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
})