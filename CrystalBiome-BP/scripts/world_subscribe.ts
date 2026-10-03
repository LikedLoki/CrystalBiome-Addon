import { EntityDamageCause, Player, system, Vector3, world } from "@minecraft/server";
import { furnaceCancel } from "./crystal_furnace_cancel";
import { wallNearby } from "./wall_other";
import { ClusterBudBreak } from "./cluster_bud_break";
import { SlayedClusterFragment, SlyaedExecutor, SlyaedWanderment } from "./crystal_guradual";
import { PrismInfo } from "./crystal-biome";
import { onBreak } from "./box_in_chest";
import { PowderBottoleProj } from "./powder_bottle_proj";
import { CrystalGemDrop, ToolSkillLevel } from "./tool_skill_level";
import { orbspawnerDie } from "./crystal_horizon";
import { orbSpawnerBreak, orbSpawnerFall } from "./orb_spawner";
import { crystalKingHealthInterlocking } from "./crystal_king";
import { giveSetLang } from "./lang";

world.afterEvents.playerSpawn.subscribe(event => {
    console.log("v")
    giveSetLang(event);
})
world.afterEvents.projectileHitBlock.subscribe((event) => {
    PowderBottoleProj(event);
});
world.afterEvents.projectileHitEntity.subscribe((event) => {
    PowderBottoleProj(event);
})
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (event.block.hasTag("cb2:box_in_chest")) onBreak(event);
})
world.afterEvents.playerBreakBlock.subscribe(event => {
    const { dimension, block } = event;
    wallNearby(dimension, block);
    furnaceCancel(dimension, block);
    ClusterBudBreak(dimension, block)
    ToolSkillLevel.tools(event)
    CrystalGemDrop.tools(event)
})
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    wallNearby(event.dimension, event.block);
})
world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity } = event
    if (damagingEntity.getComponent("minecraft:type_family")?.hasTypeFamily("crystal")) return;
    if (damagingEntity.dimension.getEntities({ families: ["cb2:crystal_giant_f"], maxDistance: 16, location: damagingEntity.location }).length === 0)
        return;
    damagingEntity.addTag("cb2:target_for_giant")
})
world.afterEvents.entityHurt.subscribe(event => {
    ToolSkillLevel.sword(event)
    //crystalKingHealthInterlocking(event);
})
world.afterEvents.entityDie.subscribe(event => {
    const { deadEntity } = event
    SlayedClusterFragment(world, deadEntity)
    SlyaedExecutor(world, deadEntity)
    SlyaedWanderment(world, deadEntity)
    orbspawnerDie(event);
    CrystalGemDrop.sword(event)
    if (deadEntity instanceof Player) {
        deadEntity.removeTag("cb2:target_for_giant")
    }
})

world.beforeEvents.entityHurt.subscribe(event => {
    orbSpawnerFall(event);
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