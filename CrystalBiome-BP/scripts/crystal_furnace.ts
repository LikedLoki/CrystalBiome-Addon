import { Block, BlockCustomComponent, system, Vector3 } from "@minecraft/server"
import { crystalBiomeEvent } from "./crystal-biome"
import { buildLocName, parseLocName, sleep } from "./other"

type FuelTypeId = typeof fuelList[number];
type FuelBlock = Block & { typeId: FuelTypeId };

const fuelList = [
    "cb2:flare_crystal_block"
] as const;

const isFuel = (block: Block): block is FuelBlock => fuelList.includes(block.typeId as typeof fuelList[number]);
const getRemainingFuel = (block: Block): number => +(block.permutation.getState("cb2:fuel" as any) || 0);
const fuelConsume = (block: Block) => {
    const next: number = getRemainingFuel(block) - 1;
    if (next > 0) block.setPermutation(block.permutation.withState("cb2:fuel" as any, next));
    else block.setType("cb2:deep_crystal_block")
}

const furnaceIgnition = (block: Block) => block.setPermutation(block.permutation.withState("cb2:lit" as any, true));
const furnaceFizz = (block: Block) => block.setPermutation(block.permutation.withState("cb2:lit" as any, false));
const getFurnaceLit = (block: Block): boolean => !!block.permutation.getState("cb2:lit" as any);

export const CrystalFurnace: BlockCustomComponent = {
    async onPlayerInteract({ dimension, block }) {
        const below: Block | undefined = block.below();
        if (!below || !isFuel(below)) return;
        if (getFurnaceLit(block)) {
            furnaceFizz(block);
            dimension.playSound("random.fizz", block.center());
            block.getComponent("minecraft:dynamic_properties")?.set("cb2:times", 0);
            return;
        }

        let remainingFuel: number = getRemainingFuel(below);
        if (remainingFuel < 1) return;

        fuelConsume(below);
            dimension.spawnParticle("cb2:powered_flare", below.center());
            dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
        furnaceIgnition(block);
    },
    onTick({ dimension, block }) {
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        const below: Block | undefined = block.below();
        if (!below || !isFuel(below)) {
            furnaceFizz(block);
            dimension.playSound("random.fizz", block.center());
            return;
        }
        crystalBiomeEvent.publish("furnace_lit", block.location)
        const currTimes: number = +(prop.get("cb2:times") || 0)
        if (currTimes < 9) prop.set("cb2:times", currTimes + 1);
        else {
            fuelConsume(below);
            dimension.spawnParticle("cb2:powered_flare", below.center());
            dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
            prop.set("cb2:times", 0)
        }

    }
}