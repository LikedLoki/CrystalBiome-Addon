import { Block, Dimension } from "@minecraft/server";
import { FurnaceContext, LocationName, smeltingEnd } from "./crystal_furnace";

export const furnaceCancel = (dimension: Dimension, block: Block) => {
    const belowBlock: Block | undefined = block.below();
    const bebelowBlock: Block | undefined = block.below(1);
    if (!belowBlock || belowBlock.typeId !== "cb2:crystal_furnace") return;
    if (!bebelowBlock || bebelowBlock.typeId !== "cb2:flare_crystal_block") return;
    if (!belowBlock.permutation.getState("cb2:flame" as any)) return;
    const { x, y, z } = belowBlock.location;
    const locName: LocationName = `${x}|${y}|${z}`;
    const aboveBlock: Block | undefined = block.above();
    if (!aboveBlock) return;
    const fCtx: FurnaceContext = { dimension: dimension, block: belowBlock, aboveBlock: aboveBlock, locName: locName, belowBlock: bebelowBlock };
    smeltingEnd(fCtx, false);
}