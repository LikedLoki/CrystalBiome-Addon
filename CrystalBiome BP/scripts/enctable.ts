import { system, BlockCustomComponent, Player, ItemStack, Container, EntityInventoryComponent, world, ItemEnchantableComponent, Enchantment, ItemDurabilityComponent } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

type Rank = {
    now: string;
    nextId: string;
}

const allowList: string[] = [
    "cb2:rough_red_crystal_sword",
    "cb2:rough_green_crystal_sword",
    "cb2:rough_blue_crystal_sword",
    "cb2:rough_yellow_crystal_sword",
    "cb2:polished_red_crystal_sword",
    "cb2:polished_green_crystal_sword",
    "cb2:polished_blue_crystal_sword",
    "cb2:polished_yellow_crystal_sword",
    "cb2:refined_red_crystal_sword",
    "cb2:refined_green_crystal_sword",
    "cb2:refined_blue_crystal_sword",
    "cb2:refined_yellow_crystal_sword",
    "cb2:rough_red_crystal_pickaxe",
    "cb2:rough_green_crystal_pickaxe",
    "cb2:rough_blue_crystal_pickaxe",
    "cb2:rough_yellow_crystal_pickaxe",
    "cb2:polished_red_crystal_pickaxe",
    "cb2:polished_green_crystal_pickaxe",
    "cb2:polished_blue_crystal_pickaxe",
    "cb2:polished_yellow_crystal_pickaxe",
    "cb2:refined_red_crystal_pickaxe",
    "cb2:refined_green_crystal_pickaxe",
    "cb2:refined_blue_crystal_pickaxe",
    "cb2:refined_yellow_crystal_pickaxe",
    "cb2:rough_red_crystal_axe",
    "cb2:rough_green_crystal_axe",
    "cb2:rough_blue_crystal_axe",
    "cb2:rough_yellow_crystal_axe",
    "cb2:polished_red_crystal_axe",
    "cb2:polished_green_crystal_axe",
    "cb2:polished_blue_crystal_axe",
    "cb2:polished_yellow_crystal_axe",
    "cb2:refined_red_crystal_axe",
    "cb2:refined_green_crystal_axe",
    "cb2:refined_blue_crystal_axe",
    "cb2:refined_yellow_crystal_axe",
    "cb2:rough_green_crystal_helmet",
    "cb2:rough_blue_crystal_chestplate",
    "cb2:rough_red_crystal_leggings",
    "cb2:rough_yellow_crystal_boots",
    "cb2:polished_green_crystal_helmet",
    "cb2:polished_blue_crystal_chestplate",
    "cb2:polished_red_crystal_leggings",
    "cb2:polished_yellow_crystal_boots",
    "cb2:refined_green_crystal_helmet",
    "cb2:refined_blue_crystal_chestplate",
    "cb2:refined_red_crystal_leggings",
    "cb2:refined_yellow_crystal_boots",
]

class ItemOrder {
    #name: string; #amount: number;
    constructor(name: string, amount: number) {
        this.#name = name;
        this.#amount = amount;
    };
    get name() {
        return this.#name;
    };
    get amount() {
        return this.#amount;
    };
}

class ItemAdmin {
    #stack: ItemStack; #enc: Enchantment[]; #durDamage: number; #name: string; #icon: string; #cost: ItemOrder[];
    private constructor(stack: ItemStack, enc: Enchantment[], durDamage: number, name: string, icon: string, cost: ItemOrder[]) {
        this.#stack = stack,
            this.#enc = enc;
        this.#durDamage = durDamage;
        this.#name = name,
            this.#icon = icon,
            this.#cost = cost;
    };
    static newCreate(player: Player): ItemAdmin | undefined {
        const container: Container | undefined = player.getComponent("inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!item || !allowList.includes(item.typeId)) return undefined;
        const enc: Enchantment[] | [] = item.getComponent("enchantable")?.getEnchantments() ?? [];
        if (!enc) return undefined;
        const dur: number = item.getComponent("durability")?.damage ?? 0;
        if (dur === undefined) return undefined;
        const words: string[] = item.typeId.replace("cb2:", "").split("_");
        const displayName: string = item.nameTag ? item.nameTag : words.map(data => itemParseMap[data]).join("");
        const iconPath: string = `textures/items/${item.typeId.replace("cb2:", "")}`;
        const toolColor: string | undefined = words.find(data => data === "red" || data === "green" || data === "blue" || data === "yellow");
        if (!toolColor) return undefined;
        const toolType: string | undefined = words.find(data => data === "rough" || data === "polished" || data === "refined");
        if (!toolType) return undefined;
        const costItem: ItemOrder[] | undefined = this.costArray(toolType, toolColor);
        if (!costItem) return undefined;
        return new ItemAdmin(item, enc, dur, displayName, iconPath, costItem);
    };
    static costArray(toolType: string, toolColor: string): ItemOrder[] | undefined {
        if (!toolType) return undefined;
        const blockId: string = toolColor !== "blue" ? `cb2:${toolColor}_crystal_block` : "cb2:crystal_block";
        const costBox: ItemOrder[] = [];
        if (toolType === "rough") {
            costBox.push(new ItemOrder(blockId, 8));
            costBox.push(new ItemOrder("cb2:rare_crystal_shard", 4));
        } else if (toolType === "polished") {
            costBox.push(new ItemOrder(blockId, 16));
            costBox.push(new ItemOrder("cb2:crysteel_ingot", 4));
        };
        return costBox;
    };
    costParse(): string | undefined {
        if (!this.#cost || this.cost.length === 0) return undefined;
        return this.#cost.reduce((acc: string, I: ItemOrder) => {
            const words: string[] = I.name.replace("cb2:", "").split("_");
            if (!words.find(II => II === "red" || II === "green" || II === "yellow" || II === "rare" || II === "crysteel")) words.unshift("blue");
            if (words.find(II => II === "rare")) words.splice(words.indexOf("crystal"), 1);
            const parsed: string = words.map(III => blockParseMap[III]).join("") + `×${I.amount}`;
            return acc + parsed + "\n";
        }, "");
    };
    get rank(): Readonly<Rank> | undefined {
        const itemRank: string | undefined = this.stack.typeId.replace("cb2:", "").split("_").find(data => data === "rough" || data === "polished" || data === "refined");
        let nextId: string = "rough";
        switch (itemRank) {
            case "rough":
                nextId = this.stack.typeId.replace("rough", "polished");
                break;
            case "polished":
                nextId = this.stack.typeId.replace("polished", "refined");
                break;
            case "refined":
                break;
        };
        if (!itemRank) return undefined;
        const result: Readonly<Rank> = { now: itemRank, nextId: nextId };
        Object.freeze(result);
        return result;
    };
    get stack(): ItemStack {
        return this.#stack;
    };
    get enc(): Enchantment[] {
        return this.#enc;
    };
    get durDamage(): number {
        return this.#durDamage;
    };
    get name(): string {
        return this.#name;
    };
    get icon(): string {
        return this.#icon
    };
    get cost(): ItemOrder[] {
        return this.#cost
    };
};

class ItemControl {
    private static hasItem(target: ItemOrder, container: Container): boolean | undefined {
        let count: number = 0;
        for (let i = 0; i < container.size; i++) {
            if (count >= target.amount) break;
            const select: ItemStack | undefined = container.getItem(i);
            if (!select) continue;
            if (select.typeId === target.name) count += select.amount;
        };
        return count >= target.amount ? true : false;
    };
    static clearItem(costList: ItemOrder[], container: Container): boolean {
        const hasItems: boolean = costList.every(data => this.hasItem(data, container));
        if (!hasItems) return false;
        for (const data of costList) {
            let { amount } = data;
            for (let I: number = 0; I < container.size; I++) {
                if (amount <= 0) break;
                let select: ItemStack | undefined = container.getItem(I);
                if (!select || select.typeId !== data.name) continue;
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
}

const itemParseMap: Record<string, string> = {
    "polished": "磨かれた",
    "refined": "研磨された",
    "red": "紅",
    "green": "翠",
    "blue": "蒼",
    "yellow": "黄",
    "crystal": "水晶の",
    "sword": "剣",
    "pickaxe": "ツルハシ",
    "axe": "斧",
    "helmet": "ヘルメット",
    "chestplate": "チェストプレート",
    "leggings": "レギンス",
    "boots": "ブーツ"
};
const blockParseMap: Record<string, string> = {
    "rare": "希少石",
    "crysteel": "玻璃鉄",
    "blue": "蒼",
    "red": "紅",
    "green": "翠",
    "yellow": "黄",
    "crystal": "水晶",
    "block": "ブロック",
    "shard": "の欠片",
    "ingot": "インゴット"
};
Object.freeze(blockParseMap);

const CPolishing: BlockCustomComponent = {
    onPlayerInteract({ player }) {
        if (!player) return;
        const itemAdmin: ItemAdmin | undefined = ItemAdmin.newCreate(player);
        if (!itemAdmin) return;
        const container: Container | undefined = player.getComponent("inventory")?.container;
        if (!container) return;
        let bodytext = ``;
        bodytext += `${itemAdmin.name ?? itemAdmin.stack.typeId} \n`;
        bodytext += "----------------------------------------------\n\n"
        bodytext += `§l必要な物§r: \n`
        bodytext += itemAdmin.costParse();

        let form = new ActionFormData();
        form.title("cb2:enc_table");
        form.button("研磨", itemAdmin.icon);
        form.body(bodytext)
        form.show(player).then((response) => {
            if (response.canceled) return;
            if (response.selection === 0) {
                const selectItem: ItemStack | undefined = container.getItem(player.selectedSlotIndex);
                if (!selectItem || selectItem.typeId !== itemAdmin.stack.typeId) {
                    player.sendMessage("エラー!!!")
                    return;
                };
                const onClear: boolean = ItemControl.clearItem(itemAdmin.cost, container);
                if (!onClear) {
                    player.sendMessage("§7アイテムが足りません");
                    return;
                };
                const newId: string | undefined = itemAdmin.rank?.nextId;
                if (!newId) return;
                const newItem: ItemStack = new ItemStack(newId, 1);
                const newDur: ItemDurabilityComponent | undefined = newItem.getComponent("durability");
                if (!newDur) return;
                newDur.damage += itemAdmin.durDamage;
                newItem.getComponent("enchantable")?.addEnchantments(itemAdmin.enc);
                container.setItem(player.selectedSlotIndex, newItem)
            }
        })
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:polishing", CPolishing);
});
