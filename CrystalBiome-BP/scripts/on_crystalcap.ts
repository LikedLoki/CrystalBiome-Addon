import { BlockCustomComponent } from "@minecraft/server";
import { Color, particleColor } from "./crystal-biome";

export const OnCrystalcap: BlockCustomComponent = {
    onStepOn({ dimension, block }) {
        particleColor.setColorRGB("variable.color", Color.blue)
        for (let i = 0; i < 4; i++) dimension.spawnParticle("cb2:crystal_particle", block.center(), particleColor);
        dimension.playSound("random.pop", block.center());
        try {
            const entity = dimension.getEntities({ location: block.center(), maxDistance: 1 })[0];
            const { x, y, z } = entity.getViewDirection()
            const dx = x * 0.25
            const dy = y * 0.25 + 0.5
            const dz = z * 0.25
            entity.applyImpulse({ x: dx, y: dy, z: dz })
        } catch (_) { }
    }
}