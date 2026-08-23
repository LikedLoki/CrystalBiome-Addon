import { Block, BlockCustomComponent, BlockCustomComponentInstance, Container, Dimension, ItemStack, Player, PlayerBreakBlockBeforeEvent, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";
import { CrystColor } from "./crystal-biome";

type Directions = "east" | "west" | "south" | "north" | "up" | "down";
type NearbyState = {
    "block": Block,
    "direction": Directions
};
type CrystalType = "block" | "cluster" | "bud" | "air";

const searchOffset = [
    { "dx": 1, "dy": 0, "dz": 0, "dir": "east" }, { "dx": -1, "dy": 0, "dz": 0, "dir": "west" }, { "dx": 0, "dy": 0, "dz": 1, "dir": "south" }, { "dx": 0, "dy": 0, "dz": -1, "dir": "north" }, { "dx": 0, "dy": 1, "dz": 0, "dir": "up" }, { "dx": 0, "dy": -1, "dz": 0, "dir": "down" }
] as const;

const scanNearby = (dimension: Dimension, { x, y, z }: Vector3): NearbyState[] => {
    const result: NearbyState[] = [];
    for (const { dx, dy, dz, dir } of searchOffset) {
        const getBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
        if (getBlock) result.push({ "block": getBlock, "direction": dir });
    }
    return result;
};


const isCrystType = (typeId: string): CrystalType => {
    const conditions = [
        /block$/.test(typeId) ? "block" : null,
        /cluster$/.test(typeId) ? "cluster" : null,
        /bud$/.test(typeId) ? "bud" : null
    ] as const;
    return conditions.find(dataI => dataI !== null) ?? "air";
};

const conditionalBranch = {
    "air": (dimension: Dimension, { block, direction }: NearbyState, color: CrystColor) => {
        dimension.setBlockType(block.location, `cb2:${color}_crystal_bud`);
        block.setPermutation(block.permutation.withState("minecraft:block_face", direction));
    },
    "bud": (dimension: Dimension, { block, direction }: NearbyState, color: CrystColor) => {
        const currGrowth: number = block.permutation.getState("cb2:growshard" as any);
        if (currGrowth < 2) block.setPermutation(block.permutation.withState("cb2:growshard" as any, currGrowth + 1));
        else {
            dimension.setBlockType(block.location, `cb2:${color}_crystal_cluster`);
            block.setPermutation(block.permutation.withState("minecraft:block_face", direction));
        }
    },
    "cluster": (dimension: Dimension, { block, direction }: NearbyState, color: CrystColor) => {
        dimension.setBlockType(block.location, `cb2:${color !== "blue" ? color + "_" : ""}crystal_block`);
    },
    "block": (dimension: Dimension, { block }: NearbyState, color: CrystColor) => {
        const nearbyBlocks: NearbyState[] = scanNearby(dimension, block.location);

        const allowList: string[] = [`cb2:${color}_crystal_bud`, "minecraft:air"];
        const allowSpace: NearbyState[] = nearbyBlocks.filter(dataI => allowList.includes(dataI.block.typeId));
        const selectVector: NearbyState | undefined = allowSpace[Math.random() * allowSpace.length | 0];
        if (!selectVector) return;
        const type: CrystalType = isCrystType(selectVector.block.typeId);
        conditionalBranch[type](dimension, selectVector, color);
    }
} as const;


const mainOrigin = (dimension: Dimension, block: Block, params: CrystColor): void => {
    const nearbyBlocks: NearbyState[] = scanNearby(dimension, block.location);

    const hasIce: boolean = nearbyBlocks.some(dataI => dataI.block.typeId === "cb2:ice_crystal_block");
    const hasBoxIce: boolean = nearbyBlocks.some(dataI => dataI.block.typeId === "cb2:compressed_ice_crystal_block");
    const allowList = hasBoxIce
        ? [`cb2:${params !== "blue" ? params + "_" : ""}crystal_block`, `cb2:${params}_crystal_cluster`, `cb2:${params}_crystal_bud`, "minecraft:air"]
        : hasIce
            ? [`cb2:${params}_crystal_bud`, "minecraft:air"]
            : undefined;
    if (!allowList) return;
    const allowSpace: NearbyState[] = nearbyBlocks.filter(dataI => allowList.includes(dataI.block.typeId));
    if (allowSpace.length === 0) return;

    for (let i = 0; i < 2; i++) {
        if (allowSpace.length === 0) return
        const selectVector: NearbyState = allowSpace.splice(Math.random() * allowSpace.length | 0, 1)[0];
        const type: CrystalType = isCrystType(selectVector.block.typeId);
        conditionalBranch[type](dimension, selectVector, params);
    }
}

export const BuddingCrystal: BlockCustomComponent = {
    "onRandomTick": ({ dimension, block }, { params }) => mainOrigin(dimension, block, params as CrystColor)
};