import { ItemCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server"
import { CrystColor, Color, particleColor } from "./crystal-biome"

export const CrystalPowder: ItemCustomComponent = {
    onUse({ source, itemStack }, { params }) {
        const param = params as CrystColor;
        const { dimension } = source;
        const { x, y, z } = source.location;
        const { x: dx, y: dy, z: dz } = source.getViewDirection()
        const frontLocation: Vector3 = { x: x + dx * 2, y: y + dy * 2, z: z + dz * 2 };
        particleColor.setColorRGB("variable.color", Color[param]);
        dimension.spawnParticle("cb2:crystal_powder_particle", frontLocation, particleColor)
        dimension.playSound("dig.sand", source.location, { "pitch": 2 })
    }
}