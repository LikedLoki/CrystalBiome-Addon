import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const gateToggle = {
    onPlayerInteract({ block }) {
        toggleOpen(block);
    }
};

// 開閉処理
function toggleOpen(block) {
    const current = block.permutation.getState("cb2:open");
    const newVal = !current; // false/true を反転
    block.setPermutation(block.permutation.withState("cb2:open", newVal));

    const below = block.below();
    const above = block.above();

    if (below && below.typeId === "cb2:fence_gate_assist") {
        below.setPermutation(below.permutation.withState("cb2:open", newVal));
    }
    if (above && above.typeId === "cb2:fence_gate_assist") {
        above.setPermutation(above.permutation.withState("cb2:open", newVal));
    }

    const dimension = block.dimension;
    dimension.playSound(newVal ? "open.fence_gate" : "close.fence_gate", block.center());
}

// 登録
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:fence_gate_toggle",
        gateToggle
    );
});
