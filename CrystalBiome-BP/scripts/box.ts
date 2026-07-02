import { Block, BlockCustomComponent, Container, ItemStack } from "@minecraft/server";
import { CrystColor } from "./crystal-biome";

type AllowedItem = ItemStack & { "typeId": keyof typeof controlMap };
type BoxBlock = Block & { "typeId": "cb2:crystal_box" | "cb2:red_crystal_box" | "cb2:green_crystal_box" | "cb2:yellow_crystal_box" | "cb2:rare_crystal_box" };
type ChestItem = ItemStack & { "typeId": keyof typeof convertChestMap };
type BoxInChestId = typeof convertChestMap[keyof typeof convertChestMap];

const colorMap = {
    "cb2:crystal_box": "blue",
    "cb2:red_crystal_box": "red",
    "cb2:green_crystal_box": "green",
    "cb2:yellow_crystal_box": "yellow",
    "cb2:rare_crystal_box": "rare",
    "cb2:crystal_chest": "blue",
    "cb2:red_crystal_chest": "red",
    "cb2:green_crystal_chest": "green",
    "cb2:yellow_crystal_chest": "yellow",
    "cb2:rare_crystal_chest": "rare",
}

const convertChestMap = {
    "cb2:crystal_chest": "cb2:crystal_box_in_chest",
    "cb2:red_crystal_chest": "cb2:red_crystal_box_in_chest",
    "cb2:green_crystal_chest": "cb2:green_crystal_box_in_chest",
    "cb2:yellow_crystal_chest": "cb2:yellow_crystal_box_in_chest",
    "cb2:rare_crystal_chest": "cb2:rare_crystal_box_in_chest",
} as const;

const chestInto = (block: BoxBlock, item: ChestItem) => {
    const matchColor = colorMap[block.typeId] === colorMap[item.typeId];
    if (!matchColor) return;
    
    const boxInChest: BoxInChestId = convertChestMap[item.typeId];
    block.dimension.setBlockType(block.location, boxInChest);
    mainEnd(block, item);
};
const controlMap = {
    "cb2:crystal_chest": chestInto,
    "cb2:red_crystal_chest": chestInto,
    "cb2:green_crystal_chest": chestInto,
    "cb2:yellow_crystal_chest": chestInto,
    "cb2:rare_crystal_chest": chestInto
} as const;

const isAllowed = (item: ItemStack): item is AllowedItem => item.typeId in controlMap;

const mainEnd = (block: Block, item: ItemStack) => {
    block.dimension.playSound("land.stone", block.location, { "pitch": 2 });
}

export const Box: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return;

        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || !isAllowed(item)) return;

        const newItem: ItemStack | undefined = item.amount - 1 <= 0 ? undefined : new ItemStack(item.typeId, item.amount - 1);
        container.setItem(player.selectedSlotIndex, newItem);
        controlMap[item.typeId](block as BoxBlock, item as any);
    }
}