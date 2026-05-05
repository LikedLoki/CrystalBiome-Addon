import { BlockComponentOnPlaceEvent, system, Block, Dimension, Vector3, BlockComponentPlayerBreakEvent } from "@minecraft/server";
const Stairs: any = {
    onPlace(event: BlockComponentOnPlaceEvent) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        updateStair(block, dimension);
        const loc: Vector3 = block.location;
        const checkset: { x: number, z: number }[] = [
            { "x": 0, "z": -1 }, { "x": 1, "z": 0 }, { "x": 0, "z": 1 }, { "x": -1, "z": 0 }
        ];
        for (const deta of checkset) {
            const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y, z: loc.z + deta.z });
            if (!getblock) return;
            const hasTag: boolean = getblock.permutation.hasTag("cb2:stairs");
            if (!hasTag) return;
            updateStair(getblock, dimension);

        };
    },
    onBreak(event: BlockComponentPlayerBreakEvent) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const loc: Vector3 = block.location;
        const checkset: { x: number, z: number }[] = [
            { "x": 0, "z": -1 }, { "x": 1, "z": 0 }, { "x": 0, "z": 1 }, { "x": -1, "z": 0 }
        ];
        for (const deta of checkset) {
            const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y, z: loc.z + deta.z });
            if (!getblock) return;
            const hasTag: boolean = getblock.permutation.hasTag("cb2:stairs");
            if (!hasTag) return;
            updateStair(getblock, dimension)

        }
    }
}

function updateStair(block: Block, dimension: Dimension) {
    //省略用 <<
    const gets = getSideBlock(block, dimension);
    if (!gets) return;
    const frontBlock: Block | undefined = gets.block.front;
    const backBlock: Block | undefined = gets.block.back;
    const part1: string | undefined = frontBlock.permutation.getState("minecraft:vertical_half");
    const part2: string | undefined = block.permutation.getState("minecraft:vertical_half");
    const part3: string | undefined = backBlock.permutation.getState("minecraft:vertical_half");
    //>>ここまで

    let frontConnect: number, backConnect: number, leftConnect: number, rightConnect: number;
    frontConnect = backConnect = leftConnect = rightConnect = 0;
    const FhasTag: boolean = frontBlock.permutation.hasTag("cb2:stairs");
    const BhasTag: boolean = backBlock.permutation.hasTag("cb2:stairs");

    //条件分岐<<
    if (FhasTag && frontBlock.permutation.getState("minecraft:cardinal_direction") === gets.relat.map.left && part1 === part2) {
        frontConnect = 1;
    } else if (FhasTag && frontBlock.permutation.getState("minecraft:cardinal_direction") === gets.relat.map.right && part1 === part2) {
        frontConnect = 2;
    }

    if (BhasTag && backBlock.permutation.getState("minecraft:cardinal_direction") === gets.relat.map.left && part3 === part2) {
        backConnect = 1;
    } else if (BhasTag && backBlock.permutation.getState("minecraft:cardinal_direction") === gets.relat.map.right && part3 === part2) {
        backConnect = 2;
    }
    //>>ここまで
    const newperm = block.permutation
        .withState("cb2:connect_front" as any, frontConnect)
        .withState("cb2:connect_back" as any, backConnect)
        .withState("cb2:connect_left" as any, leftConnect)
        .withState("cb2:connect_right" as any, rightConnect);
    block.setPermutation(newperm);

}

function getSideBlock(block: Block, dimension: Dimension): { block: { front: Block, back: Block, left: Block, right: Block }, relat: { set: { [rot: string]: { x: number, z: number } }, map: { front: string, back: string, left: string, right: string } } } | undefined {
    const loc: Vector3 = block.location;
    const facing: string | undefined = block.permutation.getState("minecraft:cardinal_direction");
    if (!facing) return;
    const offmap: { [rot: string]: { front: string, back: string, left: string, right: string } } = {
        "east": { "front": "west", "back": "east", "left": "south", "right": "north" },
        "west": { "front": "east", "back": "west", "left": "north", "right": "south" },
        "south": { "front": "north", "back": "south", "left": "west", "right": "east" },
        "north": { "front": "south", "back": "north", "left": "east", "right": "west" }
    }
    const offset: { [rot: string]: { x: number, z: number } } = {
        "east": { "x": -1, "z": 0 }, "west": { "x": 1, "z": 0 }, "south": { "x": 0, "z": -1 }, "north": { "x": 0, "z": 1 }
    };
    const self: { front: string, back: string, left: string, right: string } = offmap[facing];
    const newset: { [rot: string]: { x: number, z: number } } = {
        "front": { x: offset[self.front].x, z: offset[self.front].z },
        "back": { x: offset[self.back].x, z: offset[self.back].z },
        "left": { x: offset[self.left].x, z: offset[self.left].z },
        "right": { x: offset[self.right].x, z: offset[self.right].z }
    }
    const key: string[] = Object.keys(newset);
    const bank: Block[] = [];
    for (const data of key) {
        const kensa: Block | undefined = dimension.getBlock({ x: loc.x + newset[data].x, y: loc.y, z: loc.z + newset[data].z });
        if (!kensa) continue;
        bank.push(kensa);
    };
    return {
        "block": {
            "front": bank[0],
            "back": bank[1],
            "left": bank[2],
            "right": bank[3]
        },
        "relat": {
            "set": newset,
            "map": self
        }
    };
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:stairs", Stairs);
});