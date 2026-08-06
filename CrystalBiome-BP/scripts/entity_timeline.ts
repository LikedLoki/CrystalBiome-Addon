import { Dimension, system, world } from "@minecraft/server";
import ClusterFragment from "./cluster_fragment";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";
import CrystalExecutor from "./crystal_executor";
import { PowderAreaCloud } from "./powder_bottle_proj";


const fnList = [
    wandermentBlockTimeLine,
    CrystalExecutor.main,
    ClusterFragment.main,
    WandermentAdmin.run,
    PowderAreaCloud
] as const;

system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");
    for (const fn of fnList) {
        try { fn(overworld) }
        catch(e) {} 
    }
}, 1)
