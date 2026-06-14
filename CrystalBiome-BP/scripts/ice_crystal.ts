import { Block, BlockCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server";

const IceCrystal: BlockCustomComponent = {
    onBreak({ dimension, block }): void {
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:ice_crystal", IceCrystal);
});
