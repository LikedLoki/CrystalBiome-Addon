import { Block, BlockComponentOnPlaceEvent, BlockCustomComponent, Dimension, Vector3 } from "@minecraft/server";

type Vertical = "top" | "bottom";
type BlockFacing = "east" | "west" | "south" | "north";
type RelatFacing = "front" | "back" | "left" | "right";
type RelativeBlockList = {
    "frontBlock": Block,
    "backBlock": Block,
    "leftBlock": Block,
    "rightBlock": Block
};
type StairsState = {
        "vertical": Vertical,
        "facing": BlockFacing
};
type NearBlockState = {
    [K in RelatFacing]: StairsState | undefined
};

const relatMap = {
    "east": {
        "front": "west",
        "back": "east",
        "left": "north",
        "right": "south"
    },
    "west": {
        "front": "east",
        "back": "west",
        "left": "south",
        "right": "north"
    },
    "south": {
        "front": "north",
        "back": "south",
        "left": "east",
        "right": "west"
    },
    "north": {
        "front": "south",
        "back": "north",
        "left": "west",
        "right": "east"
    }
} as const;
const rotMap = {
    "east": { dx : -1, dz: 0 },
    "west": { dx : 1, dz: 0 },
    "south": { dx : 0, dz: -1 },
    "north": { dx : 0, dz: 1 }
} as const;

const getNearBlock = (dimension: Dimension, { x, y, z }: Vector3, blockFacing: BlockFacing): RelativeBlockList | undefined => {
    const tempList: Block[] = [];
    const facing = relatMap[blockFacing];
    for (const dataI in facing) {
        const { dx, dz } = rotMap[facing[dataI as RelatFacing]];
        const getBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
        if (getBlock) tempList.push(getBlock);
    }
    return {
        "frontBlock": tempList[0],
        "backBlock": tempList[1],
        "leftBlock": tempList[2],
        "rightBlock": tempList[3]
    };
};
const getNearState = (nearBlock: RelativeBlockList): NearBlockState => {
    const tempList: (StairsState | undefined)[] = [];
    for (const dataI in nearBlock) {
        const block: Block = nearBlock[dataI as `${RelatFacing}Block`];
        if (!block.hasTag("cb2:stairs")) {
            tempList.push(undefined);
            continue;
        }
        const vertical = block.permutation.getState("minecraft:vertical_half") as Vertical;
        const facing = block.permutation.getState("minecraft:cardinal_direction") as BlockFacing;
        tempList.push({ "vertical": vertical, "facing": facing });
    } 
    return {
        "front": tempList[0],
        "back": tempList[1],
        "left": tempList[2],
        "right": tempList[3]
    };
}

const updateStairs = (dimension: Dimension, block: Block) => {
    const facing = block.permutation.getState("minecraft:cardinal_direction");
    const vertical = block.permutation.getState("minecraft:vertical_half");
    if ((facing !== "east" && facing !== "west" && facing !== "south" && facing !== "north") || (vertical !== "top" && vertical !== "bottom" )) return;

    const selfRelatMap = relatMap[facing];
    const nearBlock: RelativeBlockList | undefined = getNearBlock(dimension, block.location, facing);
    if (!nearBlock) return;

    const nearState: NearBlockState = getNearState(nearBlock); 
    console.log(JSON.stringify(nearState))
    const { front, back } = nearState;
    const connect = { "front": 0, "back": 0 };

    console.log(vertical, front?.vertical, back?.vertical)
        console.log(selfRelatMap.left, front?.facing)

    if (vertical === front?.vertical) {
        if (selfRelatMap.left === front.facing) connect.front = 2;
        else if (selfRelatMap.right === front.facing) connect.front = 1;
    }
    if (vertical === back?.vertical) {
        if (selfRelatMap.left === back.facing) connect.back = 2;
        else if (selfRelatMap.right === back.facing) connect.back = 1;
    }
    if (connect.front !== 0 && connect.back !== 0) {
        connect.back = 0;
    }

    const currPerm = block.permutation;
    console.log(connect.front, connect.back)
    const newPerm = currPerm
        .withState("cb2:connect_front" as any, connect.front)
        .withState("cb2:connect_back" as any, connect.back);
    if (currPerm.matches(newPerm.type.id, newPerm.getAllStates())) return;
    block.setPermutation(newPerm);
    updateNearby(dimension, block);
}
const updateNearby = (dimension: Dimension, block: Block) => {
    const { x, y, z } = block.location;
    for (const { dx, dz } of Object.values(rotMap)) {
        const getBlock: Block | undefined = dimension.getBlock({ "x": x + dx, "y": y, "z": z + dz });
        if (!getBlock?.hasTag("cb2:stairs")) continue;
        updateStairs(dimension, getBlock);
    }
}

export const Stairs: BlockCustomComponent = {
    "onPlace"(event) {
        updateStairs(event.dimension, event.block);
        updateNearby(event.dimension, event.block);
    },
    "onBreak"(event) {
        updateNearby(event.dimension, event.block)
    }
}