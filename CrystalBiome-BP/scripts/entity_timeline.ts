import { Dimension, system, world } from "@minecraft/server";
import ClusterFragment from "./cluster_fragment";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";
import CrystalExecutor from "./crystal_executor";


system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");

    wandermentBlockTimeLine(overworld);
    CrystalExecutor.main(overworld);
    ClusterFragment.main(overworld);
    WandermentAdmin.run(overworld);
}, 1)
