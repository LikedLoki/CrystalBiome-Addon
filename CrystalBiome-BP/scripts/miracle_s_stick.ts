import { Dimension, EquipmentSlot, world } from "@minecraft/server";
import { sleep } from "./other";
import { particleColor } from "./crystal-biome";

export const miracleStick = (dimension: Dimension) => {
    const { id } = dimension;
    const times = +(world.getDynamicProperty(`cb2:miracle_stick_${id}`) || 0);
    if (times < 40) {
        world.setDynamicProperty(`cb2:miracle_stick_${id}`, times+1);
        return
    }
    world.setDynamicProperty(`cb2:miracle_stick_${id}`, 0);
    const entities = dimension.getEntities().filter(entity => {
        try { return entity.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Head).typeId === "cb2:crystal_stick" }
        catch(_) {}
    });
    for (const entity of entities) {
        (async () => {
            for (let degree = 0; degree < 360; degree++) {
                const { x, y, z } = entity.location;
            if (degree % 20 !== 0) continue; 
            const radian = degree * (Math.PI / 180);
            const dx = Math.cos(radian) * 0.5;
            const dz = Math.sin(radian) * 0.5
            particleColor.setColorRGB("variable.color", { red: Math.random(), green: Math.random()*2, blue: Math.random()*2 })
            dimension.spawnParticle("cb2:crystal_particle", { x: x + dx, y: y+2, z: z + dz }, particleColor)
            await sleep(5)
        }
    })()
    }
}