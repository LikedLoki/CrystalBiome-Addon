import { Block, BlockCustomComponent, Dimension } from "@minecraft/server";

const facingMap = {
    "north": [
        { dx: 1, dz: 0 },
        { dx: -1, dz: 0 },
    ],
    "south": [
        { dx: -1, dz: 0 },
        { dx: 1, dz: 0 },
    ],
    "west": [
        { dx: 0, dz: 1 },
        { dx: 0, dz: -1 },
    ],
    "east": [
        { dx: 0, dz: -1 },
        { dx: 0, dz: 1 },
    ]
}

const fenceGateUpdate = (dimension: Dimension, block: Block) => {
    const facing = block.permutation.getState("minecraft:cardinal_direction") as "north" | "south" | "west" | "east";
        let hasWall = false;
        for (const { dx, dz } of facingMap[facing]) {
            const { x, y, z } = block.location;
            const nearbyBlock = dimension.getBlock({ x: x + dx, y, z: z + dz });
            if (nearbyBlock && /_wall/.test(nearbyBlock.typeId)) {
                hasWall = true;
                break;
            }
        }
        block.setPermutation(block.permutation.withState("cb2:connect_wall" as any, hasWall));
}

export const FenceGate: BlockCustomComponent = {
    "onPlace"({ block, dimension }) {
        fenceGateUpdate(dimension, block);
    },
    "onPlayerInteract"({ block, dimension }) {
        const toggle = !!block.permutation.getState("cb2:open" as any);
        block.setPermutation(block.permutation.withState("cb2:open" as any, !toggle));
        dimension.playSound(toggle ? "close.fence_gate" : "open.fence_gate", block.location, { volume: 1, pitch: 1 });
    }
}

export const fenceGateNearby = (dimension: Dimension, block: Block) => {
    if (block.hasTag("cb2:is_fencegate")) return;
    for (const { dx, dz } of [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }]) {
        const { x, y, z } = block.location;
        const nearbyBlock = dimension.getBlock({ x: x + dx, y, z: z + dz });
        if (nearbyBlock && nearbyBlock.hasTag("cb2:is_fencegate")) {
            fenceGateUpdate(dimension, nearbyBlock);
        }
    }
}