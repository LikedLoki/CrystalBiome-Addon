import { EquipmentSlot, world } from "@minecraft/server";

const OneWayToggleBlockStateWithStick = {
    onPlayerInteract({ block, player, dimension }) {
        if (!player || !block) return;

        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return;

        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand.hasItem() || mainhand.typeId !== "cb2:crystal_heart") return;

        const currentPermutation = block.permutation;
        const currentState = currentPermutation.getState("cb2:summon");

        if (currentState === 0) {
            block.setPermutation(currentPermutation.withState("cb2:summon", 1));
            if (mainhand.amount > 1) {
                mainhand.amount--;
            } else {
                mainhand.setItem(undefined);
            }
            const effectLocation = block.center();
            dimension.playSound("block.end_portal_frame.fill", effectLocation);
            dimension.spawnParticle("cb2:cbspawner_particle", effectLocation);
        }
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:bossframe",
        OneWayToggleBlockStateWithStick
    );
});
