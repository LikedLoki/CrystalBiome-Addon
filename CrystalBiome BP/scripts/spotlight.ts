import { system, MolangVariableMap, Vector3, Block, BlockComponentRedstoneUpdateEvent, BlockPermutation, BlockComponentTickEvent, Dimension, BlockCustomComponent } from "@minecraft/server";

const fmap: {[rot:string]:Vector3} = {
    "east": { "x": 1, "y": 0, "z": 0 },
    "west": { "x": -1, "y": 0, "z": 0 },
    "south": { "x": 0, "y": 0, "z": 1 },
    "north": { "x": 0, "y": 0, "z": -1 },
    "up": { "x": 0, "y": 1, "z": 0 },
    "down": { "x": 0, "y": -1, "z": 0 }
};
const f2map: {[rot:string]:string}  = {
    "east": "west",
    "west": "east",
    "south": "north",
    "north": "south",
    "up": "down",
    "down": "up"
}
const SpotLight: BlockCustomComponent = {
    onRedstoneUpdate({ block, powerLevel}) {
        console.log(powerLevel);
        let lit: boolean = powerLevel ? true : false;
        block.setPermutation(
            block.permutation.withState("cb2:lit" as any, lit)
        )
    },
    onTick({ block, dimension }) {
        const loc: Vector3 = block.location;
        let facing: string | undefined = block.permutation.getState("minecraft:facing_direction");
        if (!facing) return;
        facing = f2map[facing];
        const vars: MolangVariableMap = new MolangVariableMap();
        const front: Block | undefined = dimension.getBlock({ x: loc.x + fmap[facing].x, y: loc.y + fmap[facing].y, z: loc.z + fmap[facing].z });
        if (!front) return;
        const back: Block | undefined = dimension.getBlock({ x: loc.x - fmap[facing].x, y: loc.y - fmap[facing].y, z: loc.z - fmap[facing].z });
        if (!back) return;
        let rare: boolean = false;
        let powered: string = "";
        switch (front.typeId) {
            case "cb2:refined_red_crystal_block": vars.setColorRGB("variable.color", { red: 1, green: 0.5, blue: 0.5 }); break;
            case "cb2:refined_green_crystal_block": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 }); break;
            case "cb2:refined_crystal_block": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 1 }); break;
            case "cb2:refined_yellow_crystal_block": vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 0.25 }); break;
            case "cb2:refined_rare_crystal_block": rare = true; break;
            default: vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 1 }); break;
        };
        if (back.typeId === "minecraft:redstone_block") powered = "_powered";
        if (!rare) {
            dimension.spawnParticle(`cb2:crystallight_${facing}${powered}`, block.center(), vars)
        } else {
            dimension.spawnParticle(`cb2:rare_crystallight_${facing}${powered}`, block.center())
        }
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:spotlight",
        SpotLight
    );
});