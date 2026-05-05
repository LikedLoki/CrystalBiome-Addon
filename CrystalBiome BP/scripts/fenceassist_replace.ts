import { Block, Dimension, PlayerBreakBlockAfterEvent, Vector3, world } from "@minecraft/server";
world.afterEvents.playerBreakBlock.subscribe((event: PlayerBreakBlockAfterEvent) => {
    const block: Block = event.block;
    const dimension: Dimension = event.dimension;
    const loc: Vector3 = block.location;
    const below: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
    if (!below) return;
    const hasTag: boolean = below.permutation.hasTag("cb2:is_fence");
    if (!hasTag) return;
    dimension.setBlockType(loc, "cb2:fence_assist");
})