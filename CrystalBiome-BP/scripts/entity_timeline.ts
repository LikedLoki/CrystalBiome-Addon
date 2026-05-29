import { Dimension, system, world } from "@minecraft/server";
import { ExecutorAdmin } from "./crystal_executor";
import { WandermentAdmin } from "./crystal_wanderment";
import { wandermentBlockTimeLine } from "./wanderment_block";


system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");

    wandermentBlockTimeLine(overworld);
    ExecutorAdmin.run(overworld);
    WandermentAdmin.run(overworld);
}, 1)
