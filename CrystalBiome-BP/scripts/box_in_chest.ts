import { Block, BlockCustomComponent, BlockCustomComponentInstance, Container, Dimension, ItemStack, Player, PlayerBreakBlockBeforeEvent, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";

type Result = "成功" | "このアイテムは入りません" | "既に他のアイテムが入っています" | "これ以上入りません";
type ItemAllowList = keyof typeof resultMap;
type BoxBlockId = keyof typeof capacityMap;
type BoxBlock = Block & { "typeId": BoxBlockId };
type ItemResultList = typeof resultMap[ItemAllowList];
export type BoxInfo = {
    "before": {
        "itemId": ItemAllowList | "cb2:$empty",
        "quantity": number
    },
    "after": {
        "itemId": ItemResultList | "cb2:$empty",
        "quantity": number
    }
}

const resultMap = {
    "cb2:crystal_block": "cb2:clear_crystal_block",
    "cb2:red_crystal_block": "cb2:clear_red_crystal_block",
    "cb2:green_crystal_block": "cb2:clear_green_crystal_block",
    "cb2:yellow_crystal_block": "cb2:clear_yellow_crystal_block",
    "cb2:crysteel_material": "cb2:crysteel_ingot",
    "cb2:crystalcap_item": "cb2:baked_crystalcap_item"
} as const;
const capacityMap = {
    "cb2:crystal_box_in_chest": 16,
    "cb2:red_crystal_box_in_chest": 8,
    "cb2:green_crystal_box_in_chest": 32,
    "cb2:yellow_crystal_box_in_chest": 8
} as const;

const propsInitialize = (block: Block): void => {
    const getProps = block.getComponent("minecraft:dynamic_properties");
    const boxInfo: BoxInfo = {
        "before": {
            "itemId": "cb2:$empty",
            "quantity": 0
        },
        "after": {
            "itemId": "cb2:$empty",
            "quantity": 0
        }
    }
    getProps?.set("cb2:box_in_chest", JSON.stringify(boxInfo));
};

const checkCondition = (blockId: BoxBlockId, itemId: string, boxInfo: BoxInfo): Result => {
    const conditions: (Result | null)[] = [
        !(itemId in resultMap) ? "このアイテムは入りません" : null,
        (itemId !== (boxInfo.before.itemId === "cb2:$empty" ? itemId : boxInfo.before.itemId)) ? "既に他のアイテムが入っています" : null,
        (boxInfo.before.quantity > capacityMap[blockId] - 1) ? "これ以上入りません" : null
    ] as const;
    return conditions.find(dataI => dataI !== null) ?? "成功";
}

const intoBox = (block: Block, props: BlockCustomComponentInstance, boxInfo: BoxInfo, itemId: ItemAllowList) => {
    const newInfo: BoxInfo = {
        "before": {
            "itemId": itemId,
            "quantity": boxInfo.before.quantity + 1
        },
        "after": {
            "itemId": resultMap[itemId],
            "quantity": boxInfo.after.quantity
        }
    };
    const infoJson: string = JSON.stringify(newInfo);
    props.set("cb2:box_in_chest", infoJson);
    block.dimension.playSound("random.pop", block.location)

}

const mainOrigin = (player: Player | undefined, block: BoxBlock): void => 
    {
    if (!player) return;

    const getProps = block.getComponent("minecraft:dynamic_properties");
    const boxInfo: BoxInfo = JSON.parse(getProps?.get("cb2:box_in_chest"));
    const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
    const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
    if (!(getProps && boxInfo && container && item)) return;

    const checkResult: Result = checkCondition(block.typeId, item.typeId, boxInfo);
    if (checkResult === "成功") {
        const newItem: ItemStack | undefined = item.amount <= 0 ? undefined : new ItemStack(item.typeId, item.amount - 1);
        container.setItem(player.selectedSlotIndex, newItem);
        intoBox(block, getProps, boxInfo, item.typeId as ItemAllowList);
    } else player.sendMessage(checkResult);
}

export const BoxInChest: BlockCustomComponent = {
    onPlace: ({ block }) => propsInitialize(block),
    onPlayerInteract: ({ player, block }) => mainOrigin(player, block as BoxBlock)
};

export const onBreak = (event: PlayerBreakBlockBeforeEvent) => {
    if (!event.block.hasTag("cb2:box_in_chest")) return;
    const getProps = event.block.getComponent("minecraft:dynamic_properties");
    const boxInfo: BoxInfo = JSON.parse(getProps?.get("cb2:box_in_chest"));
    system.run(() => {
        if (boxInfo.before.quantity > 0) {
            const B: ItemStack = new ItemStack(boxInfo.before.itemId, boxInfo.before.quantity);
            event.dimension.spawnItem(B, event.block.center());
        }
        if (boxInfo.after.quantity > 0) {
            const A: ItemStack = new ItemStack(boxInfo.after.itemId, boxInfo.after.quantity);
            event.dimension.spawnItem(A, event.block.center())
        }
    })
}