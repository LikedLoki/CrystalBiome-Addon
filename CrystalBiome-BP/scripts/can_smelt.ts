import { Block, BlockCustomComponent, Dimension, ItemStack, Vector3 } from "@minecraft/server";
import { buildLocName, sleep } from "./other";
import { Color, crystalBiomeEvent, particleColor } from "./crystal-biome";

type Params =
    | { type: "item", after: string, times: number, amount: number, chance?: number}
    | { type: "block", after: string, times: number, chance?: number }
type ComponentInfo = {
    block: Block | undefined,
    param: Params | undefined
    chance: number | undefined
}

const list: Map<string, ComponentInfo> = new Map();

const signal = (locI: Vector3, locII: Vector3) => locI.x === locII.x && locI.y === locII.y + 1 && locI.z === locII.z

crystalBiomeEvent.subscribe("furnace_lit", (event: { location: Vector3, dimension: Dimension }) => {
    list.forEach(async ({ block, param, chance }) => {
        if (!block || !param || chance === undefined) return;
        if (!signal(block.location, event.location)) return;
        console.log(chance)
        list.set(buildLocName(block.location), { block: undefined, param: undefined, chance: undefined });
        for (let i = 0; i < param.times; i++) {
            const below = block.dimension.getBlock(event.location);
            if (below?.typeId !== "cb2:crystal_furnace" || !below.permutation.getState("cb2:lit" as any)) {
                list.set(buildLocName(block.location), { block: block, param: param, chance: chance });
                return;
            }
            particleColor.setColorRGB("variable.color", Color.green);
            block.dimension.spawnParticle("cb2:crystal_particle", block.center(), particleColor)
            await sleep(5);
        }
        if (chance > Math.random()) {
            if (param.type === "item") {
                block.dimension.spawnItem(new ItemStack(param.after, param.amount), block.center());
                block.setType("minecraft:air")
            } else {
                block.setType(param.after);
            }
            particleColor.setColorRGB("variable.color", Color.blue);
            block.dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor)
            block.dimension.playSound("random.pop", block.center());
        } else {
            list.set(buildLocName(block.location), { block: block, param: param, chance: chance });
            particleColor.setColorRGB("variable.color", Color.red);
            block.dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor)
            block.dimension.playSound("random.pop", block.center(), { pitch: 0.5 });
        }
    })
})

export const CanSmelt: BlockCustomComponent = {
    onPlace({ block }, { params }) {
        console.log("d")
        const param = params as Params
        list.set(buildLocName(block.location), { block: block, param: param, chance: param.chance ?? 1 })
    },
    onBreak({ block }) {
        list.delete(buildLocName(block.location));
    }
}