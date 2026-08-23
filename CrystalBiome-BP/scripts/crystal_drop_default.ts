import { BlockComponentBlockBreakEvent, BlockCustomComponent, ItemStack } from "@minecraft/server";

type Param = { typeId: string, quantity: { min: number, max: number } }
export const CrystalDropDefault: BlockCustomComponent = {
    onBreak({ dimension, block, entitySource }, { params }) {
        if (entitySource && entitySource.typeId !== "minecraft:tnt") return;
        const param = params as Param;
        const { typeId, quantity } = param;
            const amount =  Math.floor(Math.random() * (quantity.max - quantity.min + 1) + quantity.min)
            const dropItem = new ItemStack(typeId, amount);
            try {
                dimension.spawnItem(dropItem, block.center());
            } catch(_) {}
    }
}