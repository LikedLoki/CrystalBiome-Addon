import { BlockComponentPlayerInteractEvent, BlockCustomComponent } from "@minecraft/server";
import { Color, particleColor } from "./crystal-biome"
/*
"run": [
						"execute if block ~~~ cb2:fragment_frame [\"cb2:summon\"=1] run fristia:break",
						"execute if entity @s[hasItem={item=cb2:crystal_heart_shard,quantity=0,location=slot.weapon.mainhand}] run fristia:break",
						"clear @s cb2:crystal_heart_shard 0 1",
						"playsound block.end_portal_frame.fill @a ~~~ 1 1.2",
						"particle cb2:crystal_particle_pop ~~~",
						"setblock ~~~ cb2:fragment_frame [\"cb2:summon\"=1]"
					]
                        */
export const FragmentFrame: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return;

        const state = +(block.permutation.getState("cb2:summon" as any) || 0) || 0;
        if (state === 1) return;

        const container = player.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || item.typeId !== "cb2:crystal_heart_shard") return;

        if (item.amount - 1 <= 0) {
            container.setItem(player.selectedSlotIndex);
        } else {
            item.amount--;
            container.setItem(player.selectedSlotIndex, item);
        }
        dimension.playSound("block.end_portal_frame.fill", block.center());
        particleColor.setColorRGB("variable.color", Color.blue);
        dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor);
        block.setPermutation(block.permutation.withState("cb2:summon" as any, 1));
    }
}