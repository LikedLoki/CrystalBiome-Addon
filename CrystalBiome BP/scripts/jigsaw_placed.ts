import { BlockCustomComponent, system } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const setBlock: BlockCustomComponent = {
    onTick({ block, dimension }, {params}) {
        dimension.setBlockType(block.location, `${params}`)
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:setblock", setBlock);
});
