import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const CopyDirectionAndOpen = {
    onPlace({ block, dimension }) {
        const currentBlock = dimension.getBlock(block.location);
        if (!currentBlock || currentBlock.typeId !== "cb2:fence_gate_assist") return;

        const belowPos = { x: block.location.x, y: block.location.y - 1, z: block.location.z };
        const belowBlock = dimension.getBlock(belowPos);
        if (!belowBlock) return;

        let newPermutation = currentBlock.permutation;

        // minecraft:cardinal_direction をコピー
        const direction = belowBlock.permutation.getState("minecraft:cardinal_direction");
        if (direction !== undefined) {
            newPermutation = newPermutation.withState("minecraft:cardinal_direction", direction);
        }

        // cb2:open をコピー
        const openState = belowBlock.permutation.getState("cb2:open");
        if (openState !== undefined) {
            newPermutation = newPermutation.withState("cb2:open", openState);
        }

        dimension.setBlockPermutation(block.location, newPermutation);
    }
};

// カスタムコンポーネント登録
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:fencegate_assist",
        CopyDirectionAndOpen
    );
});
