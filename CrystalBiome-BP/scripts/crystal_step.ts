import { system, MolangVariableMap, BlockComponentStepOnEvent,Block, Dimension, Vector3, BlockCustomComponent } from "@minecraft/server";
import { Color, CrystColor, particleColor } from "./crystal-biome";

export const CrystalStep: BlockCustomComponent = {
    onStepOn({ dimension, block }, { params }) {
        const param = params as CrystColor;
        particleColor.setColorRGB("variable.color", Color[param])
        if (Math.random() < 0.25) {
            const loc: Vector3 = {
                "x": block.center().x,
                "y": block.location.y + 1,
                "z": block.center().z
            }
            dimension.spawnParticle("cb2:crystal_particle", loc, particleColor);
        }
    }
};