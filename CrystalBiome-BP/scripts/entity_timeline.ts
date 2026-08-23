import { Dimension, system, world } from "@minecraft/server";
import ClusterFragment from "./cluster_fragment";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";
import CrystalExecutor from "./crystal_executor";
import { PowderAreaCloud } from "./powder_bottle_proj";

let c = 0;
const tagCheck = (dimension: Dimension) => {
    if (c < 160) {
        c++;
        return;
    }
    c = 0;
        for (const tfg of dimension.getEntities({ tags: ["cb2:target_for_giant"] })) {
            if (dimension.getEntities({ families: ["crystal_giant"], maxDistance: 32, location: tfg.location }).length === 0)
                tfg.removeTag("cb2:target_for_giant")
        }
    }

const fnList = [
    wandermentBlockTimeLine,
    CrystalExecutor.main,
    ClusterFragment.main,
    WandermentAdmin.run,
    PowderAreaCloud,
    tagCheck
] as const;

system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");
    for (const fn of fnList) {
        try { fn(overworld) }
        catch(e) {} 
    }
}, 1)
