import { Dimension, system, world } from "@minecraft/server";
import { executorTimeLine } from "./crystal_executor";

system.runInterval(() => {
    const overworld: Dimension = world.getDimension("overworld");

    executorTimeLine(overworld);
}, 1)