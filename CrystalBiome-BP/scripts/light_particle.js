import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const DetectBlockAboveAndBelow = {
    onTick({ dimension, block }) {
        dimension.spawnParticle("cb2:crystallight_all", block.center());
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:light_particle",
        DetectBlockAboveAndBelow
    );
});