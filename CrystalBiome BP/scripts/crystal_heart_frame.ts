import { BlockCustomComponent, Container, ItemStack, MolangVariableMap, system } from "@minecraft/server";

const HeartFrame: BlockCustomComponent = {
    onPlayerInteract({ block, dimension, player }) {
        const vars: MolangVariableMap = new MolangVariableMap();
        vars.setColorRGB("variable.color", {"red": 1, "green": 0.5, "blue": 0.5});
        if (block.permutation.getState("cb2:frame" as any)) return;
        if (!player) return;
        const container: Container | undefined = player.getComponent("inventory")?.container;
        if (!container) return;
        const item: ItemStack | undefined = container.getItem(player.selectedSlotIndex);
        if (!item || item.typeId !== "cb2:crystal_heart") return;
        const newAmount: number | undefined = item.amount - 1 > 0 ? (() => --item.amount)() : undefined;
        container.setItem(player.selectedSlotIndex, newAmount === undefined ? undefined : item);
        dimension.playSound("block.end_portal_frame.fill", block.location);
        dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), vars);
        block.setPermutation(block.permutation.withState("cb2:frame" as any, true));
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystal_heartframe", HeartFrame
    );
})