import { world, EquipmentSlot, GameMode, Player } from "@minecraft/server";

/** @type {import("@minecraft/server").ItemCustomComponent} */
const StaffofOrbSpike = {
    onUse({ source }) {
        source.runCommand("function spike_spawn");
        if (!(source instanceof Player)) return;

        const equippable = source.getComponent("minecraft:equippable");
        if (!equippable) return;

        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand.hasItem()) return;

        if (source.getGameMode() === "creative") return;

        const itemStack = mainhand.getItem();

        const durability = itemStack.getComponent("minecraft:durability");
        if (!durability) return;

        const enchantable = itemStack.getComponent("minecraft:enchantable");
        let unbreakingLevel = 0;
        if (enchantable) {
            const unbreaking = enchantable.getEnchantment("unbreaking");
            if (unbreaking) unbreakingLevel = unbreaking.level;
        }

        const damageChance = 1 / (unbreakingLevel + 1);

        if (Math.random() <= damageChance) {
            // 関数を呼び出す
            itemDamaged(durability, mainhand, itemStack, source);
        }

        // 関数定義
        function itemDamaged(durability, mainhand, itemStack, source) {
            const shouldBreak = durability.damage >= durability.maxDurability;

            if (shouldBreak) {
                mainhand.setItem(undefined); // Remove the item
                source.playSound("random.break"); // Play break sound
            } else {
                durability.damage++; // Increase durability damage
                mainhand.setItem(itemStack); // Update item in main hand
            }
        }

    }
};

// 登録処理
world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
        "cb2:staff_of_orb_spike",
        StaffofOrbSpike
    );
});
