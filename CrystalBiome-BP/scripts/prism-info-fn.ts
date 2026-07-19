import { Vector3, World, world } from "@minecraft/server";
import { PrismInfo } from "./crystal-biome";

export class PrismInfoAdmin {
    info: PrismInfo;
    constructor(world: World) {
        this.info = JSON.parse(world.getDynamicProperty("cb2:prismstone_info") as string);
        this.info.raid.enter ??= "none";
        this.info.raid.progress ??= "none";
        this.info.raid.currWave ??= 0;
        this.info.raid.firstOfWave ??= false;
    }
    get raid() {
        return this.info.raid;
    }
    isRaid(): boolean {
        return this.info.raid.progress === "none" ? false : true
    }
    hasQueue(): boolean {
        return this.info.raid.enter === "none" ? false : true
    }
    setValue<T extends keyof PrismInfo>(target: T, value: PrismInfo[T]) {
        this.info[target] = value;
    }
    apply(world: World) {
        world.setDynamicProperty("cb2:prismstone_info", JSON.stringify(this.info));
    }
    queueRaid(value: PrismInfo["raid"]["enter"]) {
        this.info.raid["enter"] = value;
    }
    runRaid(): boolean {
        if (this.info.raid.progress !== "none") return false;
        this.info.raid.progress = this.info.raid.enter;
        this.info.raid.currWave = 0;
        this.info.raid.firstOfWave = true;
        return true;
    }
}