import { Block, BlockCustomComponent, Dimension, EnchantmentTypeUnknownIdError, Entity, EntityDamageCause, MolangVariableMap, system, Vector3, VectorXZ } from "@minecraft/server";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn";
import { Color } from "./crystal-biome";

function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
};
function particle(block: Block, dimension: Dimension, typeId?: string): void {
           const loc: Vector3 = block.location;
        const cluster: Entity | undefined = dimension.getEntities({
            location: loc,
            maxDistance: 64,
            closest: 1,
            type: typeId ?? "cb2:sleep_cluster_fragment"
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

export const Fragment: BlockCustomComponent = {
    onTick({ block, dimension }) {
        particle(block, dimension);
    }
};

const offset: VectorXZ[] = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }
]
export const Barrier: BlockCustomComponent = {
    onTick({ block, dimension }) {
        const loc: Vector3 = block.location;
        const hasEntity: boolean = dimension.getEntities({
            location: block.location,
            tags: [`cb2:barrier_guard_${loc.x}_${loc.y}_${loc.z}`]
        })[0] ? true : false;
        if (hasEntity) return;
        const select: VectorXZ = offset[Math.floor(Math.random() * offset.length)];
        const spawnId: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
        const selectColor = ["red", "green", "blue", "yellow"][Math.random() * 4 | 0] as SettingColor;
        crystalSpawnFn(dimension, spawnId, { x: loc.x + select.x, y: loc.y, z: loc.z + select.z }, Color[selectColor]).addTag(`cb2:barrier_guard_${loc.x}_${loc.y}_${loc.z}`);
    },
    onBreak({ block, dimension }) {
        particle(block, dimension, "cb2:cluster_fragment");
        dimension.playSound("crystal.break", block.location);
        const cluster: Entity | undefined = dimension.getEntities({
            location: block.location,
            maxDistance: 64,
            closest: 1,
            type: "cb2:cluster_fragment"
        })[0];
        if (!cluster) return;
        cluster.applyDamage((cluster.getComponent("health")?.defaultValue ?? 120) /8, { cause: EntityDamageCause.override });
    }
};