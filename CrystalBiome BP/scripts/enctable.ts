import { system, ItemStack, Player, Block, Vector3, Container, Dimension, ItemDurabilityComponent, ItemEnchantableComponent, EnchantInfo, Enchantment } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

type toolId = `cb2:${string}`;

interface cbBox {
    name: string;
    info: { id: string, amount: number }[];
}

const idMap: { [id: string]: string } = {
    "cb2:rare_crystal_shard": "希少石の欠片",
    "cb2:crysteel_ingot": "玻璃鉄のインゴット",
    "cb2:crystal_block": "蒼水晶ブロック",
    "cb2:red_crystal_block": "紅水晶ブロック",
    "cb2:green_crystal_block": "翠水晶ブロック",
    "cb2:yellow_crystal_block": "黄水晶ブロック",
    "cb2:blue_crystal_pickaxe": "蒼水晶のツルハシ",
    "cb2:polished_blue_crystal_pickaxe": "磨かれた蒼水晶のツルハシ",
    "cb2:refined_blue_crystal_pickaxe": "研磨された蒼水晶のツルハシ",
    "cb2:red_crystal_pickaxe": "紅水晶のツルハシ",
    "cb2:polished_red_crystal_pickaxe": "磨かれた紅水晶のツルハシ",
    "cb2:refined_red_crystal_pickaxe": "研磨された紅水晶のツルハシ",
    "cb2:green_crystal_pickaxe": "翠水晶のツルハシ",
    "cb2:polished_green_crystal_pickaxe": "磨かれた翠水晶のツルハシ",
    "cb2:refined_green_crystal_pickaxe": "研磨された翠水晶のツルハシ",
    "cb2:yellow_crystal_pickaxe": "黄水晶のツルハシ",
    "cb2:polished_yellow_crystal_pickaxe": "磨かれた黄水晶のツルハシ",
    "cb2:refined_yellow_crystal_pickaxe": "研磨された黄水晶のツルハシ",
    "cb2:blue_crystal_sword": "蒼水晶の剣",
    "cb2:polished_blue_crystal_sword": "磨かれた蒼水晶の剣",
    "cb2:refined_blue_crystal_sword": "研磨された蒼水晶の剣",
    "cb2:red_crystal_sword": "紅水晶の剣",
    "cb2:polished_red_crystal_sword": "磨かれた紅水晶の剣",
    "cb2:refined_red_crystal_sword": "研磨された紅水晶の剣",
    "cb2:green_crystal_sword": "翠水晶の剣",
    "cb2:polished_green_crystal_sword": "磨かれた翠水晶の剣",
    "cb2:refined_green_crystal_sword": "研磨された翠水晶の剣",
    "cb2:yellow_crystal_sword": "黄水晶の剣",
    "cb2:polished_yellow_crystal_sword": "磨かれた黄水晶の剣",
    "cb2:refined_yellow_crystal_sword": "研磨された黄水晶の剣",
    "cb2:blue_crystal_axe": "蒼水晶の斧",
    "cb2:polished_blue_crystal_axe": "磨かれた蒼水晶の斧",
    "cb2:refined_blue_crystal_axe": "研磨された蒼水晶の斧",
    "cb2:red_crystal_axe": "紅水晶の斧",
    "cb2:polished_red_crystal_axe": "磨かれた紅水晶の斧",
    "cb2:refined_red_crystal_axe": "研磨された紅水晶の斧",
    "cb2:green_crystal_axe": "翠水晶の斧",
    "cb2:polished_green_crystal_axe": "磨かれた翠水晶の斧",
    "cb2:refined_green_crystal_axe": "研磨された翠水晶の斧",
    "cb2:yellow_crystal_axe": "黄水晶の斧",
    "cb2:polished_yellow_crystal_axe": "磨かれた黄水晶の斧",
    "cb2:refined_yellow_crystal_axe": "研磨された黄水晶の斧"
}

const part: string[][] = [
    ["", "polished_", "refined_"],
    ["blue_", "red_", "green_", "yellow_"],
    ["sword", "pickaxe", "axe"]
]
const iiyo: string[] = [];
for (const data1 of part[0]) {
    for (const data2 of part[1]) {
        for (const data3 of part[2]) {
            iiyo.push(`cb2:${data1}${data2}crystal_${data3}`)
        }
    }
}
const costMap: { [type: string]: { "otherItem": [{ "id": string, "amount": number }], "crystalBlock": number } } = {
    "none": {
        "otherItem": [{ "id": "cb2:rare_crystal_shard", "amount": 8 }],
        "crystalBlock": 4
    },
    "polished": {
        "otherItem": [{ "id": "cb2:crysteel_ingot", "amount": 4 }],
        "crystalBlock": 8
    },
}

const typeTarget: string[] = ["polished", "refined"];

function costItem(tool: toolId): cbBox {
    const rawId: string = tool.replace("cb2:", "");
    const type: string = rawId.split("_").find(item => typeTarget.includes(item)) ?? "none";
    const color: string = rawId.split("_").find(item => ["red", "green", "yellow"].includes(item)) ?? "";
    const costRank: { "otherItem": { id: string, amount: number }[], "crystalBlock": number } = costMap[type];
    const box: { id: string, amount: number }[] = [...costRank["otherItem"]];
    const blockItem: { id: string, amount: number } = {
        "id": `cb2:${color && color + "_"}crystal_block`,
        "amount": costRank["crystalBlock"]
    };
    box.push(blockItem)
    let display: string = "";
    for (const data of box) {
        display += `${idMap[data.id]}×${data.amount}\n`
    }

    return {
        "name": display,
        "info": box
    }
}

function hasItem(player: Player, info: { id: string, amount: number }) {
    let counter: number = 0;
    const inventory: Container | undefined = player.getComponent("inventory")?.container;
    if (!inventory) return;
    for (let i = 0; i < inventory.size; i++) {
        const item: ItemStack | undefined = inventory.getItem(i);
        if (item && item.typeId === info.id) {
            counter += item.amount;
        }
    }
    if (counter >= info.amount) return true;
    return false;
}

function clearItem(player: Player, info: { id: string, amount: number }) {
    const inventory: Container | undefined = player.getComponent("inventory")?.container;
    if (!inventory) return;
    let count: number = info.amount;
    for (let i = 0; i < inventory.size; i++) {
        const item: ItemStack | undefined = inventory.getItem(i);
        if (item && item.typeId === info.id) {
            if (item.amount <= count) {
                count -= item.amount;
                inventory.setItem(i, undefined);
            } else {
                item.amount -= count;
                inventory.setItem(i, item);
                count = 0;
            }
        }
        if (count <= 0) break;
    }
}

const CPolishing = {
    onPlayerInteract(event: any) {
        const block: Block = event.block;
        const player: Player = event.player;
        const dimension: Dimension = block.dimension;
        const loc: Vector3 = block.center();
        const inventory: Container | undefined = player.getComponent("inventory")?.container;
        const item: ItemStack = inventory?.getItem(player.selectedSlotIndex) ?? new ItemStack("minecraft:air", 1);
        if (!iiyo.includes(item.typeId)) return;
        const icon = item.typeId.replace("cb2:", "")
        const displayName = item.nameTag ?? idMap[item.typeId];
        dimension.playSound("random.pop", block.center(), { pitch: 0.5 });
        const cost: cbBox = costItem(item.typeId as toolId)
        let bodytext = ``;
        bodytext += `${displayName ?? item.typeId} \n`;
        bodytext += "----------------------------------------------\n\n"
        bodytext += `§l必要な物§r: \n`
        bodytext += `${cost.name} `

        let form = new ActionFormData();
        form.title("cb2:enc_table");
        form.button("研磨", `textures/items/${icon}`);
        form.button("修理")
        form.body(bodytext)
        form.show(player).then((response) => {
            if (response.canceled) return;
            if (response.selection === 0) {
                const nowItem: ItemStack = inventory?.getItem(player.selectedSlotIndex) ?? new ItemStack("minecraft:air", 1);
                if (nowItem.typeId !== item.typeId) {
                    player.sendMessage("エラー!!!!");
                    return;
                };
                for (const d of cost.info) {
                    if (!hasItem(player, d)) {
                        player.sendMessage("§7アイテムが不足しています");
                        return;
                    }
                };
                //研磨実行
                for (const d of cost.info) {
                    clearItem(player, d);
                };
                const type = nowItem.typeId.replace("cb2:", "").split("_").find(item => typeTarget.includes(item)) ?? "none";
                const color = nowItem.typeId.replace("cb2:", "").split("_").find(item => ["blue", "red", "green", "yellow"].includes(item));
                const tool = nowItem.typeId.replace("cb2:", "").split("_").find(item => part[2].includes(item));
                let newItem: ItemStack | undefined;
                if (type === "none") {
                    newItem = new ItemStack(`cb2:polished_${color}_crystal_${tool}`, nowItem.amount);
                } else if (type === "polished") {
                    newItem = new ItemStack(`cb2:refined_${color}_crystal_${tool}`, nowItem.amount);
                };
                if (!newItem) return;
                dimension.playSound("crystaling_polished", block.center());
                dimension.spawnParticle("cb2:crystalenctable_use", block.center())
                const dur: ItemDurabilityComponent | undefined = nowItem?.getComponent("minecraft:durability");
                const enc2: ItemEnchantableComponent | undefined = nowItem?.getComponent("minecraft:enchantable");
                const enc: any = enc2?.getEnchantments();
                const name = nowItem.nameTag;
                if (dur) newItem.getComponent("minecraft:durability")!.damage += dur.damage;
                newItem.getComponent("minecraft:enchantable")?.addEnchantments(enc)
                newItem.nameTag = name
                inventory?.setItem(player.selectedSlotIndex, newItem);
            };
        });
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:polishing", CPolishing);
});
