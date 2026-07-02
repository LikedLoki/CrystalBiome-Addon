import { world } from "@minecraft/server";
import { furnaceCancel } from "./crystal_furnace_cancel";
import { wallNearby } from "./wall_other";
import { onBreak as boxBreak } from "./box_in_chest";


world.beforeEvents.playerBreakBlock.subscribe((event) => {
    boxBreak(event);
})
world.afterEvents.playerBreakBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
    furnaceCancel(dimension, block);
})
world.afterEvents.playerPlaceBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
})