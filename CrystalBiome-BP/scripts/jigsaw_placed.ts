import { BlockCustomComponent, system } from "@minecraft/server";

export const setBlock: BlockCustomComponent = {
    onTick({ block, dimension }, {params}) {
        dimension.setBlockType(block.location, `${params}`)
    }
};