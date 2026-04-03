import { system, MolangVariableMap, BlockComponentStepOnEvent,Block, Dimension, Vector3, BlockCustomComponent } from "@minecraft/server";

const CrystalStep: any = {
    onStepOn(event: BlockComponentStepOnEvent, data: {params:{name:string}}) {
        const block: Block | undefined = event.block;
        if (!block) return;
        const dimension: Dimension = event.dimension;
        const {params} = data;
        const vars: MolangVariableMap = new MolangVariableMap();
        switch (params.name) {
            case "red": vars.setColorRGB("variable.color", { red: 1, green: 0.5, blue: 0.5 }); break;
            case "green": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 }); break;
            case "blue": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 1 }); break;
            case "yellow": vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 0.25 }); break;
        };
        if (Math.random() < 0.25) {
            const loc: Vector3 = {
                "x": block.center().x,
                "y": block.location.y + 1,
                "z": block.center().z
            }
            dimension.spawnParticle("cb2:crystal_particle", loc, vars);
        }
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:crystalstep", CrystalStep);
});
