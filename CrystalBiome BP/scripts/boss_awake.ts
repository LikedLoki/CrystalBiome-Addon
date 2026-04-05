import { world, system, Dimension, Entity, Block } from "@minecraft/server";
const offset = [
    { x: 6, y: 1, z: 0 }, { x: -6, y: 1, z: 0 }, { x: 0, y: 1, z: 6 }, { x: 0, y: 1, z: -6 }
];
const map = new Map<Entity, number>();
system.runInterval(() => {
    const dimension: Dimension = world.getDimension("overworld");
    const fragments: Entity[] | [] = dimension.getEntities(({ "type": "cb2:sleep_cluster_fragment" }));
    if (!fragments[0]) return;
    for (const fragment of fragments) {
        const tick: number | undefined = map.get(fragment);
        if (fragment.getDynamicProperty("cb2:awake") && (tick ?? 0) < 6) {
            console.log(tick)
            map.set(fragment, tick !== undefined ? tick + 1 : 1);
            continue;
        };
        map.delete(fragment);
        const hasSummon: boolean = (() => {
            const { x, y, z } = fragment.location;
            let ok = true;
            for (const loc of offset) {
                const block: Block | undefined = dimension.getBlock({ x: x + loc.x, y: y + loc.y, z: z + loc.z });
                if (!block) { ok = false; break; };
                const isFrame: boolean = block.typeId === "cb2:fragment_frame";
                console.log(isFrame);
                if (!isFrame) { ok = false; break; };
                const isSummon: boolean = block.permutation.getState("cb2:summon" as any) ? true : false;
                if (!isSummon) { ok = false; break; };
            }
            console.log(ok)
            return ok;
        })();
        if (!hasSummon) continue;
        fragment.setDynamicProperty("cb2:awake", true);
        fragment.playAnimation("animation.sleep_cluster_fragment.awake");
        //reload時のための処理を書きたい
        system.runTimeout(()=> {
            dimension.spawnEntity("cb2:cluster_fragment" as any, fragment.location);
            fragment.remove();
        }, 120);
    }

}, 20);