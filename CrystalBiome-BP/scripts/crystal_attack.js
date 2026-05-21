import { world, EquipmentSlot } from "@minecraft/server";

/** @type {import("@minecraft/server").ItemCustomComponent} */
const ATK = {
    onHitEntity({ hitEntity, attackingEntity }) {
        if (!hitEntity) return;
        const chance = 0.2;
        if (Math.random() > chance) return;
        const x = hitEntity.location.x;
        const y = hitEntity.location.y;
        const z = hitEntity.location.z;
        let damage = 6;
        const equippable = attackingEntity.getComponent("minecraft:equippable");
        if (!equippable) return;
        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand.hasItem()) return;
        const itemStack = mainhand.getItem();

        const enchantable = itemStack.getComponent("minecraft:enchantable");
        let sharpnessLevel = 0;
        if (enchantable) {
            const sharpness = enchantable.getEnchantment("sharpness");
            if (sharpness) sharpnessLevel = sharpness.level;
        }

        const critdamage = Math.floor((damage + sharpnessLevel) / 2);
        console.log(`${critdamage}`)
        hitEntity.dimension.runCommand(`damage @e[x=${x},y=${y},z=${z},r=0.5] ${critdamage} override`);
        hitEntity.dimension.runCommand(`particle cb2:crystalparticle_pop3 ${x} ${y + 1} ${z}`);
    }
};

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
        "cb2:crystal_attack",
        ATK
    );
});
