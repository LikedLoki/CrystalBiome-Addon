import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const BlockCreativeModeOnlyComponent = {
    onTick({ dimension, block }) {
        const eastOffset = { x: 1, y: 0, z: 0 };
        const westOffset = { x: -1, y: 0, z: 0 };
        const southOffset = { x: 0, y: 0, z: 1 };
        const northOffset = { x: 0, y: 0, z: -1 };
        const upOffset = { x: 0, y: 1, z: 0 };
        const downOffset = { x: 0, y: -1, z: 0 };

        const eastPos = {
            x: block.location.x + eastOffset.x,
            y: block.location.y + eastOffset.y,
            z: block.location.z + eastOffset.z
        };
        const westPos = {
            x: block.location.x + westOffset.x,
            y: block.location.y + westOffset.y,
            z: block.location.z + westOffset.z
        };

        const southPos = {
            x: block.location.x + southOffset.x,
            y: block.location.y + southOffset.y,
            z: block.location.z + southOffset.z
        };

        const northPos = {
            x: block.location.x + northOffset.x,
            y: block.location.y + northOffset.y,
            z: block.location.z + northOffset.z
        };
        const upPos = {
            x: block.location.x + upOffset.x,
            y: block.location.y + upOffset.y,
            z: block.location.z + upOffset.z
        };
        const downPos = {
            x: block.location.x + downOffset.x,
            y: block.location.y + downOffset.y,
            z: block.location.z + downOffset.z
        };

        const eastBlock = dimension.getBlock(eastPos);
        const westBlock = dimension.getBlock(westPos);
        const southBlock = dimension.getBlock(southPos);
        const northBlock = dimension.getBlock(northPos);
        const upBlock = dimension.getBlock(upPos);
        const downBlock = dimension.getBlock(downPos);

        if (!(
            eastBlock && eastBlock.typeId === "cb2:crystaloak_leaves" &&
            westBlock && westBlock.typeId === "cb2:crystaloak_leaves" &&
            southBlock && southBlock.typeId === "cb2:crystaloak_leaves" &&
            northBlock && northBlock.typeId === "cb2:crystaloak_leaves" &&
            upBlock && upBlock.typeId === "cb2:crystaloak_leaves" &&
            downBlock && downBlock.typeId === "cb2:crystaloak_leaves"
        )) {
            dimension.spawnParticle("cb2:crystaloak_particle", block.center());
        }
    }

}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystaloak_particle",
        BlockCreativeModeOnlyComponent
    );
});