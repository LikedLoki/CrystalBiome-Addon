import { BlockVolume, Dimension, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";

system.beforeEvents.startup.subscribe(({ dimensionRegistry }) => {
    dimensionRegistry.registerCustomDimension("cb2:crystal_horizon")
})

export class CrystlHrznGenerator {
    dimension: Dimension;
    startLocation: Vector3;
    facing: Vector3;
    count: number;
    branch: boolean;
    constructor(dimension: Dimension, startLocation: Vector3, facing: Vector3, count: number, branch: boolean) {
        this.dimension = dimension;
        this.startLocation = startLocation
        this.facing = facing;
        this.count = count;
        this.branch = branch;
    }
    async run() {
        for (let i = 0; i < this.count; i++) {
            const multiplier = i * 9;
            const { x, y, z } = this.startLocation;
            const base_0: Vector3 = { x: this.facing.x * multiplier, y: 0, z: this.facing.z * multiplier }
            let base_1: Vector3 = { x: x + -4 + base_0.x, y: y + -9, z: z + -4 + base_0.z };
            let base_2: Vector3 = { x: x + 4 + base_0.x, y: y + -1, z: z + 4 + base_0.z };
            world.tickingAreaManager.createTickingArea(`cb2:${JSON.stringify(this)}`, {
                dimension: this.dimension,
                from: base_1,
                to: base_2
            })
            await sleep(10)
            this.dimension.fillBlocks(new BlockVolume(base_1, base_2), "cb2:clear_crystal_block");
            world.tickingAreaManager.removeTickingArea(`cb2:${JSON.stringify(this)}`)
            if (!this.branch) continue;
            const length = i > this.count/2 ? this.count/2 - (i - this.count/2) : i;
            const leftBranch = new CrystlHrznGenerator(this.dimension, { x: x + base_0.x, y: y, z: z + base_0.z }, { x: -this.facing.z, y: 0, z: this.facing.x }, length, false);
            const rightBranch = new CrystlHrznGenerator(this.dimension, { x: x + base_0.x, y: y, z: z + base_0.z }, { x: this.facing.z, y: 0, z: -this.facing.x }, length, false);
            leftBranch.run()
            rightBranch.run()
        }
    }
}

export const CrystHrznAdmin = (dimension: Dimension, length: number) => {
    const trunk_1 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, length, true);
    trunk_1.run();
    const trunk_2 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, length, true);
    trunk_2.run();
    const trunk_3 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, length, true);
    trunk_3.run();
    const trunk_4 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, length, true);
    trunk_4.run();
    const trunk_5 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, length, false);
    trunk_5.run();
    const trunk_6 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 1 }, length, false);
    trunk_6.run();
    const trunk_7 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: -1 }, length, false);
    trunk_7.run();
    const trunk_8 = new CrystlHrznGenerator(dimension, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: -1 }, length, false);
    trunk_8.run();
};

system.runInterval(() => {
    const stop = !world.getDynamicProperty("cb2:ch_stop");
    if (stop) return;
    const times = +(world.getDynamicProperty("cb2:ch_times") ?? 0);
    world.setDynamicProperty("cb2:ch_times", times+1);
    console.log(times)
}, 1) 