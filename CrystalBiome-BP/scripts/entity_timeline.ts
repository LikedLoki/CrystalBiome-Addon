import { Dimension, system, world } from "@minecraft/server";
import ClusterFragment from "./cluster_fragment";
import CrystalExecutor from "./crystal_executor";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";


system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");

    wandermentBlockTimeLine(overworld);

    ClusterFragment.main(overworld);
    CrystalExecutor.main(overworld);
    WandermentAdmin.run(overworld);
}, 1)
