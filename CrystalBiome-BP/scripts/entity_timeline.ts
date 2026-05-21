import { Dimension, system, world } from "@minecraft/server";
import { executorTimeLine } from "./crystal_executor";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";


system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");

    wandermentBlockTimeLine(overworld);
    executorTimeLine(overworld);
    WandermentAdmin.run(overworld);
}, 1)
