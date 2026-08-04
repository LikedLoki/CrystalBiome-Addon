import { Block, BlockCustomComponent, ItemStack, Vector3 } from "@minecraft/server";
import { buildLocName, sleep } from "./other";
import { Color, crystalBiomeEvent, particleColor } from "./crystal-biome";

type Params =
    | { type: "item", after: string, times: number, amount: number }
    | { type: "block", after: string, times: number }
type ComponentInfo = {
    block: Block | undefined,
    param: Params | undefined
}

const list: Map<string, ComponentInfo> = new Map();

const signal = (locI: Vector3, locII: Vector3) => locI.x === locII.x && locI.y === locII.y + 1 && locI.z === locII.z

crystalBiomeEvent.subscribe("furnace_lit", (event: Vector3) => {
    list.forEach(async ({ block, param }) => {
        if (!block || !param) return;
        console.log(buildLocName(block?.location))
        if (!signal(block.location, event)) return;
        list.set(buildLocName(block.location), { block: undefined, param: undefined });
        for (let i = 0; i < param.times; i++) {
            const below = block.dimension.getBlock(event);
            if (below?.typeId !== "cb2:crystal_furnace" || !below.permutation.getState("cb2:lit" as any)) {
                list.set(buildLocName(block.location), { block: block, param: param });
                return;
            }
            particleColor.setColorRGB("variable.color", Color.green);
        block.dimension.spawnParticle("cb2:crystal_particle", block.center(), particleColor)
            await sleep(5);
        }
        if (param.type === "item") {
            block.dimension.spawnItem(new ItemStack(param.after, param.amount), block.center());
            block.setType("minecraft:air")
        } else {
            block.setType(param.after);
        }
        particleColor.setColorRGB("variable.color", Color.blue);
        block.dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor)
        block.dimension.playSound("random.pop", block.center());
    })
})

export const CanSmelt: BlockCustomComponent = {
    onPlace({ block }, { params }) {
        const param = params as Params
        list.set(buildLocName(block.location), { block: block, param: param })
    },
    onBreak({ block }) {
        list.delete(buildLocName(block.location));
    }
}