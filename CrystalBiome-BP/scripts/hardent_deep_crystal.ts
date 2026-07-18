import { Block, BlockCustomComponent, BlockCustomComponentInstance, Container, Dimension, ItemStack, Player, PlayerBreakBlockBeforeEvent, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";

const offset = [
    { "dx": 1, "dy": 0, "dz": 0 },
    { "dx": -1, "dy": 0, "dz": 0 },
    { "dx": 0, "dy": 1, "dz": 0 },
    { "dx": 0, "dy": -1, "dz": 0 },
    { "dx": 0, "dy": 0, "dz": 1 },
    { "dx": 0, "dy": 0, "dz": -1 }
] as const;

const isSealed = (dimension: Dimension, { x, y, z }: Vector3) => {
    for (const { dx, dy, dz } of offset) {
        if (dimension.getBlock({ "x": x + dx, "y": y + dy, "z": z + dz })?.typeId !== "cb2:deep_crystal_block")
            return false;
    }
    return true;
};
const breakNearDeep = (dimension: Dimension, { x, y, z }: Vector3) => {
    
}

export const hardentDeepCrystal: BlockCustomComponent = {
    onRandomTick({ dimension, block }) {
        if (!isSealed(dimension, block.location)) return;
        const { x, y, z } = block.location;
        block.setType("cb2:flare_crystal_ore");
        for (let i = 0; i < 4; i++) dimension.playSound("place.amethyst_block", block.location, { "pitch": 0.5, "volume": 2 });
        dimension.spawnParticle("cb2:newed_flare_particle", block.center());
        for (const { dx, dy, dz } of offset) dimension.setBlockType({ "x": x + dx, "y": y + dy, "z": z + dz }, "minecraft:air");
    }
}