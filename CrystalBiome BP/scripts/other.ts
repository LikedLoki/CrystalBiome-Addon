import { world, system, Entity, Dimension, MolangVariableMap,VanillaEntityIdentifier, Vector3 } from "@minecraft/server";
export function CrystalSpawn(name: string, pos: Vector3, dimension: Dimension, tag: string | null): void {
    const selectColor: string = ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)];
    const vars: MolangVariableMap = new MolangVariableMap();
    switch (selectColor) {
        case "red": vars.setColorRGB("variable.color", { red: 1, green: 0.5, blue: 0.5 }); break;
        case "green": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 }); break;
        case "blue": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 1 }); break;
        case "yellow": vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 0.25 }); break;
    };
    dimension.playSound("cbspawner_detect", pos);
    dimension.spawnParticle("cb2:cbspawn_particle", pos, vars);
    if (!tag) { dimension.spawnEntity(name as VanillaEntityIdentifier, pos, { spawnEvent: `cb2:color_${selectColor}` }); return; }
    dimension.spawnEntity(name as VanillaEntityIdentifier, pos, { spawnEvent: `cb2:color_${selectColor}` }).addTag(tag);
} 