import { EquipmentSlot, world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const Pose = {
    onPlayerInteract({ block, player, dimension }) {
        if (!player || !block) return;

        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return;

        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        const item = mainhand?.getItem();

        if (item && item.typeId === "cb2:crystal_heart_shard") {
            const { x, y, z } = block.location;

            let entityToSummon = "";
            switch (block.typeId) {
                case "cb2:blue_crystal_statue":
                    entityToSummon = "cb2:blue_trigger";
                    break;
                case "cb2:red_crystal_statue":
                    entityToSummon = "cb2:red_trigger";
                    break;
                case "cb2:green_crystal_statue":
                    entityToSummon = "cb2:green_trigger";
                    break;
                case "cb2:yellow_crystal_statue":
                    entityToSummon = "cb2:yellow_trigger";
                    break;
            }

            dimension.runCommandAsync(
                `summon cb2:crystal_minion ${x} ${y} ${z} ~ ~ ${entityToSummon}`
            );
            dimension.spawnParticle("cb2:cbspawner_particle2", block.center());
            dimension.playSound("crystaling_polished", block.center());

            if (item.amount > 1) {
                item.amount--;
                mainhand.setItem(item);
            } else {
                mainhand.setItem(undefined);
            }
            block.setType("minecraft:air");
            return;
        }

        const permutation = block.permutation;
        let currentValue = permutation.getState("cb2:pose") ?? 0;
        const newValue = (currentValue + 1) % 4;

        block.setPermutation(permutation.withState("cb2:pose", newValue));
    }
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystal_statue_pose",
        Pose
    );
});
