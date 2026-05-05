import { world, system, Dimension, Entity, Block, RawText, Player, ItemStack, World, Vector3 } from "@minecraft/server";
import { CrystalSpawn } from "./other";
const offset = [
    { x: 6, y: 1, z: 0 }, { x: -6, y: 1, z: 0 }, { x: 0, y: 1, z: 6 }, { x: 0, y: 1, z: -6 }
];
const spawnOffset = [
    { x: 2, y: 1, z: 0 }, { x: -2, y: 1, z: 0 }, { x: 0, y: 1, z: 2 }, { x: 0, y: 1, z: -2 }
];
const map = new Map<Entity, number>();
system.runInterval(() => {
    fragmentAwake(world);
    fragmentOne(world);
    fragmentTwo(world);
}, 20);

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    if (deadEntity.typeId !== "cb2:cluster_fragment") return;
    const dimension: Dimension = deadEntity.dimension;
    const loc: Vector3 = deadEntity.location;
    dimension.playSound("item.trident.thunder", loc, { volume: 1, pitch: 1.2 });
    dimension.spawnParticle("cb2:orbshard_bigbreak_particle", {x: loc.x, y: loc.y + 2, z: loc.z});
});

function fragmentAwake(world: World): void {
    const dimension: Dimension = world.getDimension("overworld");
    const fragments: Entity[] | [] = dimension.getEntities({ type: "cb2:sleep_cluster_fragment" });

    if (fragments.length === 0) return;

    for (const fragment of fragments) {
        const { x, y, z }: Vector3 = fragment.location;
        const tick: number = map.get(fragment) ?? 0;

        if (fragment.getDynamicProperty("cb2:awake")) {
            if (tick < 6) {
                console.log(tick);
                map.set(fragment, tick + 1);
                continue;
            }
            map.delete(fragment);
        }

        let isReadyToSummon = true;
        for (const loc of offset) {
            const block: Block | undefined = dimension.getBlock({ x: x + loc.x, y: y + loc.y, z: z + loc.z });

            if (!block || block.typeId !== "cb2:fragment_frame" || !block.permutation.getState("cb2:summon" as any)) {
                isReadyToSummon = false;
                break;
            }
        }

        if (!isReadyToSummon) continue;

        fragment.setDynamicProperty("cb2:awake", true);
        fragment.playAnimation("animation.sleep_cluster_fragment.awake");

        system.runTimeout(() => {
            if (!fragment.isValid) return;

            const finalLoc = fragment.location;

            for (const loc of offset) {
                const block = dimension.getBlock({ x: finalLoc.x + loc.x, y: finalLoc.y + loc.y, z: finalLoc.z + loc.z });
                if (block?.typeId === "cb2:fragment_frame") {
                    block.setPermutation(block.permutation.withState("cb2:summon" as any, 2));
                }
            }

            dimension.playSound("item.trident.thunder", finalLoc, { volume: 1, pitch: 0.8 });
            dimension.spawnParticle("cb2:crystal_boss_particle", finalLoc);
            dimension.spawnEntity("cb2:cluster_fragment" as any, finalLoc);
            
            fragment.remove();
        }, 120);
    }
};

function fragmentOne(world: World): void {
    const dimension: Dimension = world.getDimension("overworld");
    const fragments: Entity[] | [] = dimension.getEntities(({ "type": "cb2:cluster_fragment" }));
    if (!fragments[0]) return;
    for (const fragment of fragments) {
        let second: boolean = true;
        for (const loc of offset) {
            const block: Block | undefined = dimension.getBlock({ x: fragment.location.x + loc.x, y: fragment.location.y + loc.y, z: fragment.location.z + loc.z });
            const isFrame: boolean = block?.typeId === "cb2:fragment_frame";
            if (isFrame && block) {
                dimension.spawnParticle("cb2:crystal_barrier_particle", fragment.location);
                fragment.addEffect("resistance", 20, { amplifier: 255, showParticles: false }); 
                second = false;
            }
        };
        second ? fragment.addTag("cb2:second") : void 0 
    }
}

function fragmentTwo(world: World): void {
    const dimension: Dimension = world.getDimension("overworld");
    const fragments: Entity[] | [] = dimension.getEntities(({ "type": "cb2:cluster_fragment", "tags": ["cb2:second"] }));
    if (!fragments[0]) return;
    for (const fragment of fragments) {
        const loc: Vector3 = fragment.location;
        const hasGuard: boolean = dimension.getEntities({
            location: fragment.location,
            tags: [`cb2:fragment_guard_${loc.x}_${loc.y}_${loc.z}`]
        }).length >= 4;
        if (hasGuard) continue;
        const select: Vector3 = spawnOffset[Math.floor(Math.random() * spawnOffset.length)];
        const spawnId: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
        CrystalSpawn(spawnId, { x: loc.x + select.x, y: loc.y, z: loc.z + select.z },  dimension, `cb2:fragment_guard_${loc.x}_${loc.y}_${loc.z}`);  
    };
};