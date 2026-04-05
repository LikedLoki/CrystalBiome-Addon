import { BlockCustomComponent, Dimension, Entity, MolangVariableMap, system, Vector3 } from "@minecraft/server";

function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
};

const Fragment: BlockCustomComponent = {
    onTick({ block, dimension }) {
        const loc: Vector3 = block.location;
        const cluster: Entity | undefined = dimension.getEntities({
            location: loc,
            maxDistance: 64,
            closest: 1,
            type: "cb2:sleep_cluster_fragment"
        })[0];
        if (!cluster) return;
        const clusterLoc: Vector3 = cluster.location;
        const segment: number = 6;
        const vars: MolangVariableMap = new MolangVariableMap();
        for (let i: number = 0; i < segment; i++) {
            const cos = Math.cos(i / segment);
            vars.setColorRGB("variable.color", { red: cos / 2, green: cos, blue: cos });
            const per: number = i / segment;
            const px: number = lerp(loc.x + 0.5, clusterLoc.x, per);
            const py: number = lerp(loc.y + 0.5, clusterLoc.y + 2, per);
            const pz: number = lerp(loc.z + 0.5, clusterLoc.z, per);
            dimension.spawnParticle("cb2:fragment_particle", { x: px, y: py, z: pz }, vars);
        };
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:fragmentframe", Fragment);
});