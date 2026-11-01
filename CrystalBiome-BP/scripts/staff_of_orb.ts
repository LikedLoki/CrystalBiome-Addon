import { ItemCustomComponent, Player } from "@minecraft/server";
import { sleep } from "./other";

const dismissList = [
    "minecraft:short_grass",
    "minecraft:tall_grass",
    "cb2:blue_crystal_bud",
    "cb2:red_crystal_bud",
    "cb2:green_crystal_bud",
    "cb2:yellow_crystal_bud",
    "cb2:blue_crystal_cluster",
    "cb2:red_crystal_cluster",
    "cb2:green_crystal_cluster",
    "cb2:yellow_crystal_cluster"
]

export const StaffOfOrb: ItemCustomComponent = {
    "onUse": ({ itemStack, source }) => {
        if (!itemStack) return;
        const container = source.getComponent("minecraft:inventory")?.container;
        if (!container) return;
        const durability = itemStack?.getComponent("minecraft:durability");
        if (!durability) return;

        const isBroken = durability.damage >= durability.maxDurability;
        if (isBroken) {
            source.playSound("random.break", { pitch: 2 })
            return
        }

        const { dimension, location: { x, y, z } } = source;
        const { x: dx, y: dy, z: dz } = source.getViewDirection();
        (async () => {
            for (let i = 0; i < 4; i++) {
                dimension.playSound("random.bow", { x, y, z })
                const projectile = dimension.spawnEntity("cb2:crystalshard_proj", { x: x + dx + (Math.random()-0.5)/2, y: y + dy + 1.5 + (Math.random()-0.5)/2, z: z + dz + (Math.random()-0.5)/2 }, { "spawnEvent": `cb2:color_${["blue", "red", "green", "yellow"][Math.random() * 4 | 0]}` });
                projectile.applyImpulse({ x: dx, y: dy, z: dz });
                await sleep(2)
            }
        })()
        durability.damage++
        container.setItem(source.selectedSlotIndex, itemStack);
    },
    "onUseOn": ({ itemStack, source }) => {
        if (!itemStack || !(source instanceof Player)) return;
        const container = source.getComponent("minecraft:inventory")?.container;
        if (!container) return;
        const durability = itemStack?.getComponent("minecraft:durability");
        if (!durability) return;

        const isBroken = durability.damage >= durability.maxDurability;
        if (isBroken) {
            source.playSound("random.break", { pitch: 2 })
            return
        }

        const { dimension, location: { x, y, z } } = source;
        const { x: dx, z: dz } = source.getViewDirection();
        const spikeLength = 16;
        const firstSpace = 2;
        (async () => {
            for (let i = firstSpace; i < spikeLength + firstSpace; i++) {
                const nLocation = { x: x + dx * i, y: y, z: z + dz * i };
                const targetBlock = dimension.getBlock({ x: nLocation.x, y: nLocation.y, z: nLocation.z })
                if (targetBlock?.below()?.isAir) nLocation.y--;
                if (!targetBlock?.isAir && !dismissList.includes(targetBlock?.typeId ?? "")) nLocation.y++;
                dimension.spawnEntity("cb2:crystal_spike_orb", nLocation)
                await sleep(1);
            }
        })()
        durability.damage++
        container.setItem(source.selectedSlotIndex, itemStack);
    }
}