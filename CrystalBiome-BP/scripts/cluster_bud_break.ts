import { Block, Dimension } from "@minecraft/server";

const facingMap = {
    "east": { "dx": -1, "dy": 0, "dz": 0 },
    "west": { "dx": 1, "dy": 0, "dz": 0 },
    "south": { "dx": 0, "dy": 0, "dz": -1 },
    "north": { "dx": 0, "dy": 0, "dz": 1 },
    "up": { "dx": 0, "dy": -1, "dz": 0 },
    "down": { "dx": 0, "dy": 1, "dz": 0 }
} as const;

const rootBlockList = [
    "cb2:crystal_block",
    "cb2:red_crystal_block",
    "cb2:green_crystal_block",
    "cb2:yellow_crystal_block",
    "cb2:saline_crystal_block",
    "cb2:flare_crystal_block",
    "cb2:rare_crystal_block",
    "cb2:budding_crystal_block",
    "cb2:budding_red_crystal_block",
    "cb2:budding_green_crystal_block",
    "cb2:budding_yellow_crystal_block",
    "cb2:budding_saline_crystal_block",
    "cb2:closed_crystal_block",
    "cb2:closed_red_crystal_block",
    "cb2:closed_green_crystal_block",
    "cb2:closed_yellow_crystal_block",
    "cb2:closed_saline_crystal_block",
] as const;

const getNearbyClustBud = (dimension: Dimension, block: Block) => {
    const result = [];
    for (const { dx, dy, dz } of Object.values(facingMap)) {
        const nearbyBlock: Block | undefined = dimension.getBlock({ "x": block.location.x + dx, "y": block.location.y + dy, "z": block.location.z + dz });
        if (!nearbyBlock) continue;
        if (nearbyBlock.hasTag("cb2:cluster_bud")) result.push(nearbyBlock);
    }
    return result;
}

const isFacingKey = (str: string): str is keyof typeof facingMap => str in facingMap;

export const ClusterBudBreak = (dimension: Dimension, block: Block) => {
    const nearbyClusterBud = getNearbyClustBud(dimension, block);
    if (nearbyClusterBud.length === 0) return;
    for (const dataI of nearbyClusterBud) {
        const getFacing = dataI.permutation.getState("minecraft:block_face");
        if (!getFacing || !isFacingKey(getFacing)) continue;
        const { x, y, z } = dataI.location;
        const { dx, dy, dz } = facingMap[getFacing];
        const rootBlock: Block | undefined = dimension.getBlock({ "x": x + dx, "y": y + dy, "z": z + dz });
        if (!rootBlock) return;
        if (!rootBlockList.includes(rootBlock.typeId as typeof rootBlockList[number])) dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
    }
}