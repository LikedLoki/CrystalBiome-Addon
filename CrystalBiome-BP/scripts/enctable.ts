import { system, BlockCustomComponent, Player, ItemStack, Container, EntityInventoryComponent, world, ItemEnchantableComponent, Enchantment, ItemDurabilityComponent } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

type AllowedId = keyof typeof costMap;
type AllowedItem = ItemStack & { typeId: AllowedId };
type FirstToken = "rough" | "polished" | "refined";
type SecondToken = "red" | "green" | "blue" | "yellow";
type ThirdToken = "crystal";
type FourthToken = "sword" | "pickaxe" | "axe";
type ArmorToken = ["green", "crystal", "helmet"] | ["blue", "crystal", "chestplate"] | ["red", "crystal", "leggings"] | ["yellow", "crystal", "boots"];
type IdTuple = [FirstToken, SecondToken, ThirdToken, FourthToken] | [FirstToken, ...ArmorToken];
type IdString = `cb2:${FirstToken}_${SecondToken}_${ThirdToken}_${FourthToken}` | `cb2:${FirstToken}_${"green_crystal_helmet" | "blue_crystal_chestplate" | "red_crystal_leggings" | "yellow_crystal_boots"}`;
type ItemRequired = {
    typeId: string,
    amount: number
};
type Rank = {
    now: "rough" | "polished" | "refined",
    next: "rough" | "polished" | "refined" | "none",
}
const itmReq = (typeId: string, amount: number): ItemRequired => ({ typeId: typeId, amount: amount });
const costMap: Record<IdString, ItemRequired[]> = {
    "cb2:rough_red_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_green_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_blue_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_yellow_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_red_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_green_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_blue_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_yellow_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_red_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_green_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_blue_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_yellow_crystal_sword": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_red_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_green_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_blue_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_yellow_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_red_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_green_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_blue_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_yellow_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_red_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_green_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_blue_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_yellow_crystal_pickaxe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_red_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_green_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_blue_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_yellow_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_red_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_green_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_blue_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_yellow_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_red_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_green_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_blue_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_yellow_crystal_axe": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_green_crystal_helmet": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_blue_crystal_chestplate": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_red_crystal_leggings": [itmReq("cb2:crystal_block", 8),],
    "cb2:rough_yellow_crystal_boots": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_green_crystal_helmet": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_blue_crystal_chestplate": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_red_crystal_leggings": [itmReq("cb2:crystal_block", 8),],
    "cb2:polished_yellow_crystal_boots": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_green_crystal_helmet": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_blue_crystal_chestplate": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_red_crystal_leggings": [itmReq("cb2:crystal_block", 8),],
    "cb2:refined_yellow_crystal_boots": [itmReq("cb2:crystal_block", 8),]
}
const parseMap = {
    rough: "粗い",
    polished: "磨かれた",
    refined: "研磨された",
    blue: "蒼",
    red: "紅",
    green: "翠",
    yellow: "黄",
    crystal: "水晶",
    sword: "剣",
    axe: "斧",
    pickaxe: "ツルハシ",
    helmet: "ヘルメット",
    chestplate: "チェストプレート",
    leggings: "レギンス",
    boots: "ブーツ"
} as const;
const translateMap = {
    "cb2:crystal_block": "蒼水晶の原石",
    "cb2:red_crystal_block": "紅水晶の原石",
    "cb2:green_crystal_block": "翠水晶の原石",
    "cb2:yellow_crystal_block": "黄水晶の原石"
} as const;
const rankMap = {
    "rough": "polished",
    "polished": "refined",
    "refined": "none"
} as const;

class ItemAdmin {
    #item: AllowedItem;
    #typeId: IdTuple;
    #cost: ItemRequired[];
    #rank: Rank;
    constructor(itemStack: AllowedItem) {
        this.#item = itemStack;
        this.#typeId = this.#item.typeId.replace("cb2:", "").split("_") as IdTuple;
        this.#cost = costMap[this.typeId];
        this.#rank = { now: this.#typeId[0], next: rankMap[this.#typeId[0]] };
    }
    get typeId(): AllowedId {
        return ("cb2:" + this.#typeId.join("_")) as AllowedId;
    }
    get name(): string {
        return parseMap[this.#typeId[0]] + parseMap[this.#typeId[1]] + parseMap[this.#typeId[2]] + "の" + parseMap[this.#typeId[3]]
    }
    get iconPath(): string {
        return `textures/items/${this.#typeId.join("_")}`;
    }
    get cost() {
        return this.#cost;
    }
    get costText(): string {
        let result = "";
        for (const { typeId, amount } of this.#cost)
            result += (translateMap[typeId as keyof typeof translateMap] + "×" + amount + "\n");
        return result;
    }
    get nextRankId(): string {
        return `cb2:${this.#rank.next}_${this.#typeId[1]}_${this.#typeId[2]}_${this.#typeId[3]}`;
    }
    get durDamage(): number {
        return this.#item.getComponent("minecraft:durability")?.damage || 0;
    }
    get enchants(): Enchantment[] {
        return this.#item.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
    }
}

const hasItem = (container: Container, target: ItemRequired) => {
    let count: number = 0;
    for (let i = 0; i < container.size; i++) {
        if (count >= target.amount) break;
        const select: ItemStack | undefined = container.getItem(i);
        if (!select) continue;
        if (select.typeId === target.typeId) count += select.amount;
    };
    return count >= target.amount ? true : false;
};
const clearItem = (costList: ItemRequired[], container: Container) => {
    const hasItems: boolean = costList.every(data => hasItem(container, data));
    if (!hasItems) return false;
    for (const data of costList) {
        let { amount } = data;
        for (let I: number = 0; I < container.size; I++) {
            if (amount <= 0) break;
            let select: ItemStack | undefined = container.getItem(I);
            if (!select || select.typeId !== data.typeId) continue;
            if (select.amount >= amount) {
                const then: number = select.amount;
                if ((select.amount - amount) <= 0) select = undefined;
                else select.amount -= amount;
                amount -= then;
            } else {
                amount -= select.amount;
                select = undefined;
            };
            container.setItem(I, select);
        }
    };
    return true;
}

const isAllowed = (item: ItemStack): item is AllowedItem => item.typeId in costMap;

export const CPolishing: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return;

        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || !isAllowed(item)) return;

        const itemAdmin = new ItemAdmin(item);

        let bodyText = "";
        bodyText += `${itemAdmin.name ?? itemAdmin.typeId} \n`;
        bodyText += "----------------------------------\n\n"
        bodyText += `§l必要な物§r: \n`
        bodyText += itemAdmin.costText;

        const form = new ActionFormData();
        form.title("cb2:enc_table");
        form.button("研磨", itemAdmin.iconPath);
        form.body(bodyText);
        form.show(player).then(res => {
            if (res.canceled) return;
            if (res.selection === 0) {
                const selectItem: ItemStack | undefined = container.getItem(player.selectedSlotIndex);
                if (!selectItem || selectItem.typeId !== itemAdmin.typeId) {
                    player.sendMessage("エラー!!!")
                    return;
                }
                const onClear: boolean = clearItem(itemAdmin.cost, container);
                if (!onClear) {
                    player.sendMessage("§7アイテムが足りません");
                    return;
                };
                const newItem: ItemStack = new ItemStack(itemAdmin.nextRankId, 1);
                const newDur: ItemDurabilityComponent | undefined = newItem.getComponent("durability");
                if (!newDur) return;
                newDur.damage += itemAdmin.durDamage;
                newItem.getComponent("enchantable")?.addEnchantments(itemAdmin.enchants);
                container.setItem(player.selectedSlotIndex, newItem)
            }
        })
    }
}