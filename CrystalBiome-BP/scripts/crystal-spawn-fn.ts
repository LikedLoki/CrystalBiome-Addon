import { Dimension, Entity, MolangVariableMap, Vector3 } from "@minecraft/server";
import { Color, CrystColor, CrystRGB, particleColor } from "./crystal-biome"

export type SettingColor = CrystColor | CrystRGB;

const invertedColorMap = new Map<CrystRGB, CrystColor>(
    Object.entries(Color).map(([key, value]) => [value, key as CrystColor])
);

export const crystalSpawnFn = (dimension: Dimension, typeId: string, location: Vector3, color: typeof Color[keyof typeof Color], entityColor: boolean = true, despawn: boolean = true): Entity => {
    particleColor.setColorRGB("variable.color", color);

    if (typeId === "cb2:crystal_guard" || typeId === "cb2:crystal_wander") {
        const spawnedEntity: Entity = entityColor
            ? dimension.spawnEntity(typeId, location, { spawnEvent: `cb2:color_${invertedColorMap.get(color)}` })
            : dimension.spawnEntity(typeId, location);

        if (despawn) spawnedEntity.triggerEvent("cb2:can_despawn");
        dimension.playSound("cbspawner_detect", location);
        dimension.spawnParticle("cb2:cbspawn_particle", location, particleColor);

        return spawnedEntity;
    } else {
        dimension.spawnEntity(typeId, location);
        dimension.playSound("cbspawner_detect", location);
        dimension.spawnParticle("cb2:cbspawn_particle", location, particleColor);
    }
}