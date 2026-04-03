import { Dimension, Block, PlayerPlaceBlockAfterEvent, world, Vector3, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { updateWall, updateAssist } from "./wall.js";
world.afterEvents.playerPlaceBlock.subscribe((event: PlayerPlaceBlockAfterEvent) => {
    const block: Block = event.block;
    const dimension: Dimension = event.dimension;
    const hasTag: boolean = block.permutation.hasTag("cb2:is_wall");
    if (hasTag) return;
    const loc: Vector3 = block.location;
    const ue: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z })
    if (!ue) return;
    if (ue.typeId === "cb2:wall_assist") {
        dimension.setBlockType({ x: loc.x, y: loc.y + 1, z: loc.z }, "minecraft:air");
    }
    const checkset: Vector3[] = [
        { "x": 0, "y": 0, "z": -1 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": -1, "z": 0 }
    ];
    for (const deta of checkset) {
        const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y + deta.y, z: loc.z + deta.z });
        if (!getblock) continue;
        const hasTag: boolean = getblock.permutation.hasTag("cb2:is_wall");
        if (!hasTag) continue;
        const newloc: Vector3 = getblock.location;
        updateWall(getblock, dimension);
        const above: Block | undefined = dimension.getBlock({ x: newloc.x, y: newloc.y + 1, z: newloc.z });
        if (!above) continue;
        if (above.typeId === "cb2:wall_assist") updateAssist(above, dimension);

    }
});
world.afterEvents.playerBreakBlock.subscribe((event: PlayerBreakBlockAfterEvent) => {
    const block: Block = event.block;
    const dimension: Dimension = event.dimension;
    const hasTag: boolean = block.permutation.hasTag("cb2:is_wall");
    if (hasTag) return;
    const loc: Vector3 = block.location;
    const ue: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
    if (!ue) return;
    if (ue.typeId === "cb2:wall_assist") {
        dimension.setBlockType({ x: loc.x, y: loc.y + 1, z: loc.z }, "minecraft:air");
    }
    const checkset: Vector3[] = [
        { "x": 0, "y": 0, "z": -1 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": -1, "z": 0 }
    ];
    for (const deta of checkset) {
        const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y + deta.y, z: loc.z + deta.z });
        if (!getblock) continue;
        const hasTag: boolean = getblock.permutation.hasTag("cb2:is_wall");
        if (!hasTag) continue;
        console.log("s")
        const newloc: Vector3 = getblock.location;
        updateWall(getblock, dimension);
        const above: Block | undefined = dimension.getBlock({ x: newloc.x, y: newloc.y + 1, z: newloc.z });
        if (!above) continue;
        if (above.typeId === "cb2:wall_assist") updateAssist(above, dimension);

    }
});
