import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const BlockCreativeModeOnlyComponent = {
    onPlace({ dimension, block }) {
        const offsets = [
            { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }
        ];

        let maxNeighborPop = 0;
        for (const off of offsets) {
            const adj = dimension.getBlock({ x: block.location.x + off.x, y: block.location.y + off.y, z: block.location.z + off.z });
            if (!adj) continue;
            const pop = adj.typeId === "cb2:crystaloak_leaves_nature" ? adj.permutation.getState("cb2:leaves_pop") : adj.typeId === "cb2:crystaloak_log" ? 8 : 0;
            if (pop > maxNeighborPop) maxNeighborPop = pop;
        }

        //自分のleaves_popを周囲の最大値-1 に設定(最低0)
        const newPop = Math.max(0, maxNeighborPop - 1);
        if (newPop > 0) {
            dimension.setBlockPermutation(block.location, block.permutation.withState("cb2:leaves_pop", newPop));
        }
    }
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:leaves_check",
        BlockCreativeModeOnlyComponent
    );
});