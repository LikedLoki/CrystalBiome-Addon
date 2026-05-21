import { world, EquipmentSlot } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const Blue = {
    onPlayerDestroy({ block, player }) {
        if (!player) return;
        const equippable = player.getComponent("minecraft:equippable");
        const mainhand = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand);
        const item = mainhand?.getItem();

        if (item && item.typeId === "cb2:yellow_crystal_pickaxe") {
            return;
        }

        block.setType("cb2:minion_break_blue_block");
    }
};

const Red = {
    onPlayerDestroy({ block, player }) {
        if (!player) return;
        const equippable = player.getComponent("minecraft:equippable");
        const item = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
        if (item && item.typeId === "cb2:yellow_crystal_pickaxe") return;

        block.setType("cb2:minion_break_red_block");
    }
};

const Green = {
    onPlayerDestroy({ block, player }) {
        if (!player) return;
        const equippable = player.getComponent("minecraft:equippable");
        const item = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
        if (item && item.typeId === "cb2:yellow_crystal_pickaxe") return;

        block.setType("cb2:minion_break_green_block");
    }
};

const Yellow = {
    onPlayerDestroy({ block, player }) {
        if (!player) return;
        const equippable = player.getComponent("minecraft:equippable");
        const item = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
        if (item && item.typeId === "cb2:yellow_crystal_pickaxe") return;

        block.setType("cb2:minion_break_yellow_block");
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:minion_blue_break", Blue);
    blockComponentRegistry.registerCustomComponent("cb2:minion_red_break", Red);
    blockComponentRegistry.registerCustomComponent("cb2:minion_green_break", Green);
    blockComponentRegistry.registerCustomComponent("cb2:minion_yellow_break", Yellow);
});
