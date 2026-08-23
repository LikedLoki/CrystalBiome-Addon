import { Block, BlockCustomComponent, Container, Dimension, ItemStack, MolangVariableMap, system, Vector3 } from "@minecraft/server";

type IceState = "I" | "II";
type Level = 0 | 1;

const progIceFailed = (dimension: Dimension, block: Block, level: Level): void => {
    if (level === 0) block.setType("cb2:ice_crystal_block");
    else block.setPermutation(block.permutation.withState("cb2:ice_state" as any, 0));
    dimension.playSound("random.glass", block.location, { "pitch": 1.5, "volume": 2 });
};
const progIceSuccess = (dimension: Dimension, block: Block, isFinal: boolean): void => {
    if (isFinal) block.setType("cb2:compressed_ice_crystal_block");
    else block.setPermutation(block.permutation.withState("cb2:ice_state" as any, 1));
    dimension.playSound("break.amethyst_block", block.location, { "pitch": 1.5, "volume": 2 });
}

const progIceFnMap = {
    "I": (dimension: Dimension, block: Block): void => {
        if (Math.random() < 0.6) progIceSuccess(dimension, block, false);
        else progIceFailed(dimension, block, 0);
    },
    "II": (dimension: Dimension, block: Block): void => {
        if (Math.random() < 0.4) progIceSuccess(dimension, block, true);
        else progIceFailed(dimension, block, 1);
    }
} as const;

export const ProgressIceCrystal: BlockCustomComponent = {
    onPlayerInteract({ dimension, block, player }): void {
        if (!player) return;

        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || item.typeId !== "cb2:ice_crystal_block") return;

        if (item.amount - 1 === 0) {
            container.setItem(player.selectedSlotIndex);
        } else {
            item.amount--;
            container.setItem(player.selectedSlotIndex, item);
        }
        
        const isState: IceState = block.permutation.getState("cb2:ice_state" as any) === 0 ? "I" : "II";
        progIceFnMap[isState](dimension, block);
    }
};
export const CompressedIceCrystal: BlockCustomComponent = {
    onTick: ({ dimension, block }) => dimension.spawnParticle("cb2:ice_crystal_particle", block.center())
}