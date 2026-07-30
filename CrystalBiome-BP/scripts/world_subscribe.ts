import { EntityDamageCause, system, Vector3, world } from "@minecraft/server";
import { furnaceCancel } from "./crystal_furnace_cancel";
import { wallNearby } from "./wall_other";
import { ClusterBudBreak } from "./cluster_bud_break";
import { SlayedClusterFragment, SlyaedExecutor, SlyaedWanderment } from "./crystal_guradual";
import { PrismInfo } from "./crystal-biome";
import { onBreak } from "./box_in_chest";


world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (event.block.hasTag("cb2:box_in_chest")) onBreak(event);
})
world.afterEvents.playerBreakBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
    furnaceCancel(dimension, block);
    ClusterBudBreak(dimension, block)
})
world.afterEvents.playerPlaceBlock.subscribe(({ dimension, block }) => {
    wallNearby(dimension, block);
})
world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    SlayedClusterFragment(world, deadEntity)
    SlyaedExecutor(world, deadEntity)
    SlyaedWanderment(world, deadEntity)
})


const A = () => system.run(() => {
    const is: boolean = !!world.getDynamicProperty("cb2:prismstone_info");
    if (!is) {
        const info: PrismInfo = {
            "location": { x: 0, y: 0, z: 0 },
            "center": { x: 0.5, y: 0.5, z: 0.5 },
            /** 
             * - 0 = 未設置
             * - 1 = 壊れてる
             * - 2 = 起動済み
             */
            "state": 0,
            "raid": {
                "enter": "none",
                "progress": "none",
                "currWave": 0,
                "firstOfWave": false,
                "attacked": 0
            }
        } as const;
        world.setDynamicProperty("cb2:prismstone_info", JSON.stringify(info));
    }
})

system.beforeEvents.startup.subscribe(A)