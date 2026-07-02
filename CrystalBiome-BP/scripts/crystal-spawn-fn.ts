import { Dimension, Entity, MolangVariableMap, Vector3 } from "@minecraft/server";
import { CrystColor, CrystRGB } from "./crystal-biome"

export type SettingColor = CrystColor | CrystRGB;

const colorMap = {
    "red": { red: 1, green: 0.5, blue: 0.5 },
    "green": { red: 0.2, green: 1, blue: 0.75 },
    "blue": { red: 0.2, green: 1, blue: 1 },
    "yellow": { red: 1, green: 1, blue: 0.25 },
    "rare": { red: 0, green: 0.8, blue: 0.8 },
} as const;

export const crystalSpawnFn = (dimension: Dimension, typeId: string, location: Vector3, color: SettingColor, entityColor: boolean = true): Entity => {
    const selectColor: CrystRGB = typeof color === "string" ? colorMap[color] : color;
    const particleColor: MolangVariableMap = new MolangVariableMap();
    particleColor.setColorRGB("variable.color", selectColor);

    const spawnedEntity: Entity = entityColor
        ? dimension.spawnEntity(typeId, location, { spawnEvent: `cb2:color_${color}` })
        : dimension.spawnEntity(typeId, location);

    dimension.playSound("cbspawner_detect", location);
    dimension.spawnParticle("cb2:cbspawn_particle", location, particleColor);

    return spawnedEntity;
}