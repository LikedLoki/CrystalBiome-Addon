import { Block, BlockCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server";

const colorList: string[] = [
    "blue", "red", "green", "yellow", "rare"
];
const clusterList: string[] = colorList.map(data => `cb2:${data}_crystal_cluster`);

const Display: BlockCustomComponent = {
    onTick({ block, dimension }) {
        const { x, y, z }: Vector3 = block.location;
        const upper: Block | undefined = dimension.getBlock({ x: x, y: y + 1, z: z});
        if (!upper || !clusterList.includes(upper.typeId)) return;
        const word: string[] = upper.typeId.replace("cb2:", "").split("_");
        const clusterColor: string = word.find(data => colorList.includes(data)) ?? "blue";
        const vars: MolangVariableMap = new MolangVariableMap();
        let particleType: string = "cb2:crystal_display_particle";
        switch (clusterColor) {
            case "red": vars.setColorRGB("variable.color", { red: 1, green: 0.5, blue: 0.5 }); break;
            case "green": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 }); break;
            case "blue": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 1 }); break;
            case "yellow": vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 0.25 }); break;
            case "rare": vars.setColorRGB("variable.color", { red: 0, green: 0.8, blue: 0.8 }); particleType = "cb2:crystal_display_particle_rare"; break;
        };
        dimension.spawnParticle(particleType, upper.center(), vars);
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:cluster_display", Display);
});
