import { Block, BlockCustomComponent, BlockCustomComponentInstance, BlockDynamicPropertiesComponent, Container, Dimension, ItemStack, Player, PlayerBreakBlockBeforeEvent, system, Vector3, world } from "@minecraft/server";
import { buildLocName, parseLocName, sleep } from "./other";
import { crystalBiomeEvent } from "./crystal-biome";

type AllowedItem = ItemStack & { typeId: keyof typeof smeltingMap };
type BoxChestInfo = {
    before: {
        typeId: string | null,
        quantity: number
    }
    after: {
        typeId: string | null,
        quantity: number
    }
}

const smeltingMap = {
    "cb2:crystal_block": "cb2:clear_crystal_block",
    "cb2:red_crystal_block": "cb2:clear_red_crystal_block",
    "cb2:green_crystal_block": "cb2:clear_green_crystal_block",
    "cb2:yellow_crystal_block": "cb2:clear_yellow_crystal_block",
    "cb2:crystalcap_item": "cb2:baked_crystalcap_item"
} as const;

const signal = (locI: Vector3, locII: Vector3) => locI.x === locII.x && locI.y === locII.y + 1 && locI.z === locII.z

const boxList: Map<string, Block> = new Map();

crystalBiomeEvent.subscribe("furnace_lit", (event: Vector3) => {
    boxList.forEach(block => {
        if (!signal(block.location, event)) return;
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        const info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;
        if (info.before.typeId === null) return;
        const times: number = +(prop.get("cb2:times") || 0);
        if (times < 9) {
            prop.set("cb2:times", times + 1);
            return;
        }
        if (info.before.quantity > 0) {
            info.before.quantity--;
            info.after.quantity++;
        }
        block.dimension.playSound("random.pop", block.center())
        prop.set("cb2:box_chest_info", JSON.stringify(info));
        prop.set("cb2:times", 0);
    })
})

const isAllowed = (item: ItemStack): item is AllowedItem => item.typeId in smeltingMap;

export const BoxInChest: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return;
        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || !isAllowed(item)) return;

        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;

        const info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;
        if (info.before.typeId !== null && info.before.typeId !== item.typeId) {
            player.sendMessage("えぇ");
            return;
        }
        info.before.typeId = item.typeId;
        info.before.quantity++;
        info.after.typeId = smeltingMap[item.typeId];
        console.log(JSON.stringify(info))
        prop.set("cb2:box_chest_info", JSON.stringify(info));
    },
    onPlace({ block }) {
        boxList.set(buildLocName(block.location), block);
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        prop.set("cb2:box_chest_info", JSON.stringify({
            before: { typeId: null, quantity: 0 },
            after: { typeId: null, quantity: 0 }
        }))
    },
};
export const onBreak = ({ dimension, block }: PlayerBreakBlockBeforeEvent) => {
    boxList.delete(buildLocName(block.location));
    const prop = block.getComponent("minecraft:dynamic_properties");
    if (!prop) return;
    const info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;
    system.run(() => {
        if (info.before.typeId && info.before.quantity) dimension.spawnItem(new ItemStack(info.before.typeId, info.before.quantity), block.center())
        if (info.after.typeId && info.after.quantity) dimension.spawnItem(new ItemStack(info.after.typeId, info.after.quantity), block.center())
    })

}