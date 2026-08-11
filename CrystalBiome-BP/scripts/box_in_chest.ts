import { Block, BlockCustomComponent, BlockCustomComponentInstance, BlockDynamicPropertiesComponent, Container, Dimension, Enchantment, EnchantmentType, EnchantmentTypes, ItemStack, Player, PlayerBreakBlockBeforeEvent, SmeltItemFunction, system, Vector3, world } from "@minecraft/server";
import { buildLocName, parseLocName, sleep } from "./other";
import { Color, crystalBiomeEvent, particleColor } from "./crystal-biome";

type WhiteListId = keyof typeof whiteList;
type WhiteListItem = ItemStack & { typeId: WhiteListId }
type CrystalFurnaceAllowedId = keyof typeof smeltingMap;
type CrystalFurnaceAllowedItem = ItemStack & { typeId: CrystalFurnaceAllowedId }
type SynthesisAllowedId = typeof synthesisList[number];
type SynthesisAllowedItem = ItemStack & { typeId: SynthesisAllowedId };
export type BoxChestInfo =
    | {
        state: "none"
    }
    | {
        state: "exist",
        value: {
            localize: string,
            typeId: WhiteListId,
            quantity: number,
            durDmg: number | null,
            enchants: Enchantment[] | null,
            skill: number | null
        }
    }
    | {
        state: "exist-f"
        value: {
            localize: string,
            typeId: CrystalFurnaceAllowedId,
            quantity: number
        }
        smelted: {
            typeId: typeof smeltingMap[CrystalFurnaceAllowedId]
            quantity: number
        }
        smelting: boolean
    }

/**
 * 投入できるアイテムの定義。
 * キーがTypeId、値が投入可能な最大個数。
 */
const whiteList = {
    "cb2:crystal_block": 64,
    "cb2:red_crystal_block": 64,
    "cb2:green_crystal_block": 64,
    "cb2:yellow_crystal_block": 64,
    "cb2:crystalcap_item": 64,
    "cb2:rough_blue_crystal_sword": 1,
    "cb2:rough_red_crystal_sword": 1,
    "cb2:rough_green_crystal_sword": 1,
    "cb2:rough_yellow_crystal_sword": 1,
    "cb2:rough_blue_crystal_pickaxe": 1,
    "cb2:rough_red_crystal_pickaxe": 1,
    "cb2:rough_green_crystal_pickaxe": 1,
    "cb2:rough_yellow_crystal_pickaxe": 1,
    "cb2:rough_blue_crystal_axe": 1,
    "cb2:rough_red_crystal_axe": 1,
    "cb2:rough_green_crystal_axe": 1,
    "cb2:rough_yellow_crystal_axe": 1
} as const;

/**
 * 許可されたアイテムのうち、水晶炉で精錬可能なものと精錬の結果。
*/
const smeltingMap = {
    "cb2:crystal_block": "cb2:clear_crystal_block",
    "cb2:red_crystal_block": "cb2:clear_red_crystal_block",
    "cb2:green_crystal_block": "cb2:clear_green_crystal_block",
    "cb2:yellow_crystal_block": "cb2:clear_yellow_crystal_block",
    "cb2:crystalcap_item": "cb2:baked_crystalcap_item"
} as const;
const synthesisList = [
    "cb2:rough_blue_crystal_sword"
] as const;

/**
 * イベントを発行した水晶炉の真上に自身があるなら、真を返す。
 */
const signal = (locI: Vector3, locII: Vector3) => locI.x === locII.x && locI.y === locII.y + 1 && locI.z === locII.z

let boxList: Map<string, Vector3>;
system.run(() => {
    boxList = new Map(JSON.parse(world.getDynamicProperty("cb2:box_list") as string ?? "[]"))
})
system.beforeEvents.shutdown.subscribe(() => {
    world.setDynamicProperty("cb2:box_list", JSON.stringify([...boxList]))
})


/**
 * 水晶炉からのイベントトリガーを受け取る。
 */
crystalBiomeEvent.subscribe("furnace_lit", (event: { location: Vector3, dimension: Dimension }) => {
    boxList.forEach(location => {
        if (!signal(location, event.location)) return;
        const block = event.dimension.getBlock(location);
        if (!block) return;
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        let info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;
        if (info.state === "exist" && is.crystlFrncTypeId(info.value.typeId)) {
            info = {
                state: "exist-f",
                value: { localize: info.value.localize, typeId: info.value.typeId, quantity: info.value.quantity },
                smelted: { typeId: smeltingMap[info.value.typeId], quantity: 0 },
                smelting: true
            }
        }
        if (info.state !== "exist-f" || !info.smelting) return;
        const times: number = +(prop.get("cb2:times") || 0);
        particleColor.setColorRGB("variable.color", Color.green);
        block.dimension.spawnParticle("cb2:crystal_particle", block.center(), particleColor)
        if (times < 9) {
            prop.set("cb2:times", times + 1);
            return;
        }
        info.value.quantity--;
        info.smelted.quantity++;
        block.dimension.playSound("random.pop", block.center());
        if (info.value.quantity === 0) {
            particleColor.setColorRGB("variable.color", Color.blue);
            block.dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor)
            info.smelting = false
        }
        prop.set("cb2:box_chest_info", JSON.stringify(info));
        prop.set("cb2:times", 0);
    })
})

/**
 * 変数の型検証関数群。
 */
const is = {
    whiteListItem: (item: ItemStack | undefined): item is WhiteListItem => !item ? false : item.typeId in whiteList,
    crystlFrncItem: (item: WhiteListItem): item is CrystalFurnaceAllowedItem => item.typeId in smeltingMap,
    synthesisItem: (item: WhiteListItem): item is SynthesisAllowedItem => synthesisList.includes(item.typeId as SynthesisAllowedId),
    crystlFrncTypeId: (item: WhiteListId): item is CrystalFurnaceAllowedId => item in smeltingMap,
    synthesisTypeId: (item: WhiteListId): item is SynthesisAllowedId => synthesisList.includes(item as SynthesisAllowedId)
} as const

export const BoxInChest: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        // プライヤーのコンテナが存在しないか、アイテムが許可されてないなら切り返し。
        if (!player) return;
        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !is.whiteListItem(item) && item !== undefined) return;

        // 詳細取得
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        let info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;


        if (item === undefined && info.state !== "none") {
            player.sendMessage([`§7内容物: `, { translate: info.value.localize }, ` * ${info.value.quantity}`])
            return;
        } else if (item === undefined) return;

        // 既に入ってるのと違うアイテムを入れようとしたら、警告と切り返し。
        if (info.state !== "none" && info.value.typeId !== item.typeId) {
            player.sendMessage("§7既に他のアイテムが入っています")
            return;
        }
        // 個数制限に抵触してるなら、切り返し。
        if (info.state !== "none" && info.value.quantity >= whiteList[info.value.typeId]) {
            player.sendMessage("§7これ以上入りません")
            return;
        }

        // アイテム消費。
        const newItem = item.amount > 1 ? new ItemStack(item.typeId, item.amount - 1) : undefined;
        container.setItem(player.selectedSlotIndex, newItem);

        // アイテム投入の反映。
        if (info.state === "none") {
            const durability = item.getComponent("minecraft:durability");
            const enchants = item.getComponent("minecraft:enchantable");
            const skill = +(item.getDynamicProperty("cb2:crystal_tools_skill") || 0)
            info = {
                state: "exist",
                value: {
                    localize: item.localizationKey,
                    typeId: item.typeId,
                    quantity: 1,
                    durDmg: durability ? durability.damage : null,
                    enchants: enchants ? enchants.getEnchantments() : null,
                    skill: skill
                },
            }
        } else {
            info.value.quantity++;
        }
        prop.set("cb2:box_chest_info", JSON.stringify(info));
    },
    onPlace({ block }) {
        boxList.set(buildLocName(block.location), block);
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;
        prop.set("cb2:box_chest_info", JSON.stringify({
            state: "none"
        }))
    },
};
export const onBreak = ({ dimension, block }: PlayerBreakBlockBeforeEvent) => {
    boxList.delete(buildLocName(block.location));
    const prop = block.getComponent("minecraft:dynamic_properties");
    if (!prop) return;
    const info = JSON.parse(prop.get("cb2:box_chest_info") as string) as BoxChestInfo;
    if (info.state === "none") return;
    system.run(() => {
        if (info.state === "exist") {
            const dropItem = new ItemStack(info.value.typeId, info.value.quantity);
            const { value: { durDmg, enchants, skill } } = info;
            if (durDmg) dropItem.getComponent("minecraft:durability")!.damage = durDmg;
            if (enchants) {
                const enchantss: Enchantment[] = [];
                for (const enchant of Object.values(enchants)) {
                    const encType = EnchantmentTypes.get(enchant.type.id);
                    if (!encType) return false;
                    enchants.push({ level: enchant.level, type: encType })
                }
                dropItem.getComponent("minecraft:enchantable")!.addEnchantments(enchantss)
            }
            if (skill) dropItem.setDynamicProperty("cb2:crystal_tools_skill", skill)
            dropItem.setLore([`§r§7| 修練度 -> ${info.value.skill}`])
            dimension.spawnItem(dropItem, block.center())
        }
        if (info.state === "exist-f" && info.smelted.typeId && info.smelted.quantity) {
            const dropItem = new ItemStack(info.value.typeId, info.value.quantity);
            dimension.spawnItem(dropItem, block.center())
            dimension.spawnItem(new ItemStack(info.smelted.typeId, info.smelted.quantity), block.center())
        }
    })

}