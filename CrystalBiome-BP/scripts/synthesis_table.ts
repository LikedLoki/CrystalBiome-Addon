import { Block, BlockCustomComponent, BlockDynamicPropertiesComponent, Enchantment, EnchantmentTypes, ItemStack, world } from "@minecraft/server";
import { BoxChestInfo } from "./box_in_chest";
import { CrystColor, CrystRank } from "./crystal-biome";

type ExistBoxChestInfo = Extract<BoxChestInfo, { state: "exist" }>;

class SynthesisAdmin {
    blocks: Block[]
    values: ExistBoxChestInfo[];
    constructor(blocks: Block[], values: ExistBoxChestInfo[]) {
        this.blocks = blocks
        this.values = values
    }
    included(typeId: string, quantity: number): boolean {
        return (typeId === this.values[0].value.typeId && quantity === this.values[0].value.quantity) || (typeId === this.values[1].value.typeId && quantity === this.values[1].value.quantity)
    }
    consume(typeId: string, quantity: number): boolean {
        const props = [this.blocks[0].getComponent("minecraft:dynamic_properties")!, this.blocks[1].getComponent("minecraft:dynamic_properties")!]
        if (this.values[0].value.typeId === typeId && this.values[0].value.quantity >= quantity) {
            this.values[0].value.quantity -= quantity;
            if (this.values[0].value.quantity === 0) props[0].set("cb2:box_chest_info", JSON.stringify({ state: "none" }))
            else props[0].set(JSON.stringify(this.values[0]))
        } else if (this.values[1].value.typeId === typeId && this.values[1].value.quantity >= quantity) {
            this.values[1].value.quantity -= quantity;
            if (this.values[1].value.quantity === 0) props[1].set("cb2:box_chest_info", JSON.stringify({ state: "none" }))
            else props[1].set(JSON.stringify(this.values[1]))
        } else {
            return false
        }
        return true;
    }
    recipe(required: ([string, number] | [string, number, number])[]): undefined | [boolean, [string, number][]] {
        const toConsume: [boolean, string, number][] = [];
        for (const item of required) {
            if (item.length === 2) {
                const [typeId, quantity] = item;
                if (!this.included(typeId, quantity)) return;
                toConsume.push([false, ...item])
            } else {
                const [typeId, minQuantity, maxQuantity] = item;
                for (let quantity = maxQuantity; quantity >= minQuantity; quantity--) {
                    if (this.included(typeId, quantity)) {
                        toConsume.push([true, typeId, quantity]);
                        break
                    } else if (quantity === minQuantity) {
                        return
                    }
                }
            }
        }
        for (const [_, typeId, quantity] of toConsume) {
            this.consume(typeId, quantity)
        }
        return [true, toConsume.filter(data => data[0] === true).map(data => [data[1], data[2]])]
    }
}

const facingOffset = {
    "east": [
        { dx: 0, dz: -1 },
        { dx: 0, dz: 1 }
    ],
    "west": [
        { dx: 0, dz: 1 },
        { dx: 0, dz: -1 }
    ],
    "south": [
        { dx: -1, dz: 0 },
        { dx: 1, dz: 0 }
    ],
    "north": [
        { dx: 1, dz: 0 },
        { dx: -1, dz: 0 }
    ]
} as const;


/**
 * 引数 itemの耐久値をinfoと同期させる関数
 */
const syncDurability = (info: ExistBoxChestInfo, item: ItemStack, heal: number, n: number): boolean => {
    if (info.value.durDmg === null) return false;
    const dur = item.getComponent("minecraft:durability");
    if (!dur) return false
    const healDur = dur.maxDurability / heal * n
    const newDamage = info.value.durDmg - healDur;
    if (newDamage < 0) dur.damage = 0;
    else if (newDamage > dur.maxDurability) dur.damage = dur.maxDurability
    else dur.damage = newDamage
    return true
}

/**
 * 引数 itemのエンチャントをinfoと同期させる関数
 */
const syncEnchantments = (info: ExistBoxChestInfo, item: ItemStack): boolean => {
    if (!info.value.enchants) return true;
    const enc = item.getComponent("minecraft:enchantable");
    if (!enc) return false;
    const enchants: Enchantment[] = [];
    for (const enchant of Object.values(info.value.enchants)) {
        const encType = EnchantmentTypes.get(enchant.type.id);
        if (!encType) return false;
        enchants.push({ level: enchant.level, type: encType })
    }

    enc.addEnchantments(enchants);
    return true
}

/**
 * 引数 itemの修練度をinfoと同期させる関数
 */
const syncSkill = (info: ExistBoxChestInfo, item: ItemStack): boolean => {
    if (info.value.skill === null) return false;
    item.setDynamicProperty("cb2:crystal_tools_skill", info.value.skill)
    item.setLore([`§r§7| 修練度 -> ${info.value.skill}`])
    return true
}

/**
 * 粗い水晶の剣を修理するための関数
*/
const crystalToolRepair = (infos: ExistBoxChestInfo[], rank: CrystRank, color: CrystColor, tool: string, heal: number, n: number): ItemStack | undefined => {
    // 結果のアイテムを準備
    const result = new ItemStack(`cb2:${rank}_${color}_crystal_${tool}`, 1)
    const [first, second] = infos;
    const inTool = first.value.typeId === `cb2:${rank}_${color}_crystal_${tool}` ? first : second;

    // 同期
        syncDurability(inTool, result, heal, n),
        syncEnchantments(inTool, result),
        syncSkill(inTool, result)
    return result
}

const roughSwordRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "rough", color, "sword", 4, n);
const roughPickAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "rough", color, "pickaxe",  4, n);
const roughAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "rough", color, "axe",  4, n);

const polishedSwordRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "polished", color, "sword",  8, n);
const polishedPickAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "polished", color, "pickaxe", 8, n);
const polishedAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "polished", color, "axe", 8, n);

const refinedSwordRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "refined", color, "sword", 12, n);
const refinedPickAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "refined", color, "pickaxe", 12, n);
const refinedAxeRepair = (infos: ExistBoxChestInfo[], color: CrystColor, n: number): ItemStack | undefined => 
    crystalToolRepair(infos, "refined", color, "axe", 12, n);

export const SynthesisTable: BlockCustomComponent = {
    onPlayerInteract({ dimension, block, player }) {
        if (!player) return;
        const facing = block.permutation.getState("minecraft:cardinal_direction") as ("east" | "west" | "south" | "north");
        const offset = facingOffset[facing];

        const boxChests: Block[] = []
        const boxChestValues: ExistBoxChestInfo[] = []
        for (const { dx, dz } of offset) {
            const { x, y, z } = block.location;
            const fetchedBlock = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
            if (fetchedBlock?.typeId !== "cb2:crystal_box_in_chest" && fetchedBlock?.typeId !== "cb2:red_crystal_box_in_chest" && fetchedBlock?.typeId !== "cb2:green_crystal_box_in_chest" && fetchedBlock?.typeId !== "cb2:yellow_crystal_box_in_chest") {
                player.sendMessage("§7左右にチェスト入り箱がありません")
                return;
            } else {
                const prop = fetchedBlock.getComponent("minecraft:dynamic_properties");
                const info = JSON.parse(prop?.get("cb2:box_chest_info") as string) as BoxChestInfo
                if (info.state !== "exist") {
                    player.sendMessage("§7材料がありません")
                    return;
                }
                boxChests.push(fetchedBlock)
                boxChestValues.push(info)
            }
        }
        const admin = new SynthesisAdmin(boxChests, boxChestValues)

        // レシピ定義
        // r: rough, b: blue, c: crystal, s: sword
        const rbcsRepair = admin.recipe([["cb2:rough_blue_crystal_sword", 1], ["cb2:crystal_block", 1, 4]]);
        const rrcsRepair = admin.recipe([["cb2:rough_red_crystal_sword", 1], ["cb2:red_crystal_block", 1, 4]]);
        const rgcsRepair = admin.recipe([["cb2:rough_green_crystal_sword", 1], ["cb2:green_crystal_block", 1, 4]]);
        const rycsRepair = admin.recipe([["cb2:rough_yellow_crystal_sword", 1], ["cb2:yellow_crystal_block", 1, 4]]);
        // r: rough, b: blue, c: crystal, p: pickaxe
        const rbcpRepair = admin.recipe([["cb2:rough_blue_crystal_pickaxe", 1], ["cb2:crystal_block", 1, 4]]);
        const rrcpRepair = admin.recipe([["cb2:rough_red_crystal_pickaxe", 1], ["cb2:red_crystal_block", 1, 4]]);
        const rgcpRepair = admin.recipe([["cb2:rough_green_crystal_pickaxe", 1], ["cb2:green_crystal_block", 1, 4]]);
        const rycpRepair = admin.recipe([["cb2:rough_yellow_crystal_pickaxe", 1], ["cb2:yellow_crystal_block", 1, 4]]);
        // r: rough, b: blue, c: crystal, a: axe
        const rbcaRepair = admin.recipe([["cb2:rough_blue_crystal_axe", 1], ["cb2:crystal_block", 1, 4]]);
        const rrcaRepair = admin.recipe([["cb2:rough_red_crystal_axe", 1], ["cb2:red_crystal_block", 1, 4]]);
        const rgcaRepair = admin.recipe([["cb2:rough_green_crystal_axe", 1], ["cb2:green_crystal_block", 1, 4]]);
        const rycaRepair = admin.recipe([["cb2:rough_yellow_crystal_axe", 1], ["cb2:yellow_crystal_block", 1, 4]]);
        // r: rough, a: armor h: helmet
        const rahRepair = admin.recipe([["cb2:rough_green_crystal_helmet", 1], ["cb2:green_crystal_block", 1, 4]])
        const racRepair = admin.recipe([["cb2:rough_blue_crystal_chestplate", 1], ["cb2:crystal_block", 1, 4]])
        const ralRepair = admin.recipe([["cb2:rough_red_crystal_leggings", 1], ["cb2:red_crystal_block", 1, 4]])
        const rabRepair = admin.recipe([["cb2:rough_yellow_crystal_boots", 1], ["cb2:yellow_crystal_block", 1, 4]])
        
        // p: polished, b: blue, c: crystal, s: sword
        const pbcsRepair = admin.recipe([["cb2:polished_blue_crystal_sword", 1], ["cb2:polished_crystal_block", 1, 8]]);
        const prcsRepair = admin.recipe([["cb2:polished_red_crystal_sword", 1], ["cb2:polished_red_crystal_block", 1, 8]]);
        const pgcsRepair = admin.recipe([["cb2:polished_green_crystal_sword", 1], ["cb2:polished_green_crystal_block", 1, 8]]);
        const pycsRepair = admin.recipe([["cb2:polished_yellow_crystal_sword", 1], ["cb2:polished_yellow_crystal_block", 1, 8]]);
        // p: polished, b: blue, c: crystal, p: pickaxe
        const pbcpRepair = admin.recipe([["cb2:polished_blue_crystal_pickaxe", 1], ["cb2:polished_crystal_block", 1, 8]]);
        const prcpRepair = admin.recipe([["cb2:polished_red_crystal_pickaxe", 1], ["cb2:polished_red_crystal_block", 1, 8]]);
        const pgcpRepair = admin.recipe([["cb2:polished_green_crystal_pickaxe", 1], ["cb2:polished_green_crystal_block", 1, 8]]);
        const pycpRepair = admin.recipe([["cb2:polished_yellow_crystal_pickaxe", 1], ["cb2:polished_yellow_crystal_block", 1, 8]]);
        // p: polished, b: blue, c: crystal, a: axe
        const pbcaRepair = admin.recipe([["cb2:polished_blue_crystal_axe", 1], ["cb2:polished_crystal_block", 1, 8]]);
        const prcaRepair = admin.recipe([["cb2:polished_red_crystal_axe", 1], ["cb2:polished_red_crystal_block", 1, 8]]);
        const pgcaRepair = admin.recipe([["cb2:polished_green_crystal_axe", 1], ["cb2:polished_green_crystal_block", 1, 8]]);
        const pycaRepair = admin.recipe([["cb2:polished_yellow_crystal_axe", 1], ["cb2:polished_yellow_crystal_block", 1, 8]]);
        // r: polished, a: armor h: helmet
        const pahRepair = admin.recipe([["cb2:polished_green_crystal_helmet", 1], ["cb2:polished_green_crystal_block", 1, 8]])
        const pacRepair = admin.recipe([["cb2:polished_blue_crystal_chestplate", 1], ["cb2:polished_crystal_block", 1, 8]])
        const palRepair = admin.recipe([["cb2:polished_red_crystal_leggings", 1], ["cb2:polished_red_crystal_block", 1, 8]])
        const pabRepair = admin.recipe([["cb2:polsihed_yellow_crystal_boots", 1], ["cb2:polished_yellow_crystal_block", 1, 8]])

        // rf: refined, b: blue, c: crystal, s: sword
        const rfbcsRepair = admin.recipe([["cb2:refined_blue_crystal_sword", 1], ["cb2:refined_crystal_block", 1, 12]]);
        const rfrcsRepair = admin.recipe([["cb2:refined_red_crystal_sword", 1], ["cb2:refined_red_crystal_block", 1, 12]]);
        const rfgcsRepair = admin.recipe([["cb2:refined_green_crystal_sword", 1], ["cb2:refined_green_crystal_block", 1, 12]]);
        const rfycsRepair = admin.recipe([["cb2:refined_yellow_crystal_sword", 1], ["cb2:refined_yellow_crystal_block", 1, 12]]);
        // rf: refined, b: blue, c: crystal, p: pickaxe
        const rfbcpRepair = admin.recipe([["cb2:refined_blue_crystal_pickaxe", 1], ["cb2:refined_crystal_block", 1, 12]]);
        const rfrcpRepair = admin.recipe([["cb2:refined_red_crystal_pickaxe", 1], ["cb2:refined_red_crystal_block", 1, 12]]);
        const rfgcpRepair = admin.recipe([["cb2:refined_green_crystal_pickaxe", 1], ["cb2:refined_green_crystal_block", 1, 12]]);
        const rfycpRepair = admin.recipe([["cb2:refined_yellow_crystal_pickaxe", 1], ["cb2:refined_yellow_crystal_block", 1, 12]]);
        // rf: refined, b: blue, c: crystal, a: axe
        const rfbcaRepair = admin.recipe([["cb2:refined_blue_crystal_axe", 1], ["cb2:refined_crystal_block", 1, 12]]);
        const rfrcaRepair = admin.recipe([["cb2:refined_red_crystal_axe", 1], ["cb2:refined_red_crystal_block", 1, 12]]);
        const rfgcaRepair = admin.recipe([["cb2:refined_green_crystal_axe", 1], ["cb2:refined_green_crystal_block", 1, 12]]);
        const rfycaRepair = admin.recipe([["cb2:refined_yellow_crystal_axe", 1], ["cb2:refined_yellow_crystal_block", 1, 12]]);
        // rf: refined, a: armor h: helmet
        const rfahRepair = admin.recipe([["cb2:refined_green_crystal_helmet", 1], ["cb2:refined_green_crystal_block", 1, 12]])
        const rfacRepair = admin.recipe([["cb2:refined_blue_crystal_chestplate", 1], ["cb2:refined_crystal_block", 1, 12]])
        const rfalRepair = admin.recipe([["cb2:refined_red_crystal_leggings", 1], ["cb2:refined_red_crystal_block", 1, 12]])
        const rfabRepair = admin.recipe([["cb2:refined_yellow_crystal_boots", 1], ["cb2:refined_yellow_crystal_block", 1, 12]])

        // 判定
        // 粗い水晶の剣
        if (rbcsRepair) {
            const result = roughSwordRepair(boxChestValues, "blue", rbcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rrcsRepair) {
            const result = roughSwordRepair(boxChestValues, "red", rrcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rgcsRepair) {
            const result = roughSwordRepair(boxChestValues, "green", rgcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rycsRepair) {
            const result = roughSwordRepair(boxChestValues, "yellow", rycsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 粗い水晶のツルハシ
        else if (rbcpRepair) {
            const result = roughPickAxeRepair(boxChestValues, "blue", rbcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rrcpRepair) {
            const result = roughPickAxeRepair(boxChestValues, "red", rrcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rgcpRepair) {
            const result = roughPickAxeRepair(boxChestValues, "green", rgcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rycpRepair) {
            const result = roughPickAxeRepair(boxChestValues, "yellow", rycpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 粗い水晶の斧
        else if (rbcaRepair) {
            const result = roughAxeRepair(boxChestValues, "blue", rbcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rrcaRepair) {
            const result = roughAxeRepair(boxChestValues, "red", rrcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rgcaRepair) {
            const result = roughAxeRepair(boxChestValues, "green", rgcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rycaRepair) {
            const result = roughAxeRepair(boxChestValues, "yellow", rycaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 粗い水晶の防具
        else if (rahRepair) {
            const result = crystalToolRepair(boxChestValues, "rough", "green", "helmet", 4, rahRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (racRepair) {
            const result = crystalToolRepair(boxChestValues, "rough", "blue", "chestplate", 4, racRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (ralRepair) {
            const result = crystalToolRepair(boxChestValues, "rough", "red", "leggings", 4, ralRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rabRepair) {
            const result = crystalToolRepair(boxChestValues, "rough", "yellow", "boots", 4, rabRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 磨かれた水晶の剣
        else if (pbcsRepair) {
            const result = polishedSwordRepair(boxChestValues, "blue", pbcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (prcsRepair) {
            const result = polishedSwordRepair(boxChestValues, "red", prcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pgcsRepair) {
            const result = polishedSwordRepair(boxChestValues, "green", pgcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pycsRepair) {
            const result = polishedSwordRepair(boxChestValues, "yellow", pycsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 磨かれた水晶のツルハシ
        else if (pbcpRepair) {
            const result = polishedPickAxeRepair(boxChestValues, "blue", pbcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (prcpRepair) {
            const result = polishedPickAxeRepair(boxChestValues, "red", prcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pgcpRepair) {
            const result = polishedPickAxeRepair(boxChestValues, "green", pgcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pycpRepair) {
            const result = polishedPickAxeRepair(boxChestValues, "yellow", pycpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 磨かれた水晶の斧
        else if (pbcaRepair) {
            const result = polishedAxeRepair(boxChestValues, "blue", pbcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (prcaRepair) {
            const result = polishedAxeRepair(boxChestValues, "red", prcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pgcaRepair) {
            const result = polishedAxeRepair(boxChestValues, "green", pgcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pycaRepair) {
            const result = polishedAxeRepair(boxChestValues, "yellow", pycaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 磨かれた水晶の防具
        else if (pahRepair) {
            const result = crystalToolRepair(boxChestValues, "polished", "green", "helmet", 4, pahRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pacRepair) {
            const result = crystalToolRepair(boxChestValues, "polished", "blue", "chestplate", 4, pacRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (palRepair) {
            const result = crystalToolRepair(boxChestValues, "polished", "red", "leggings", 4, palRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (pabRepair) {
            const result = crystalToolRepair(boxChestValues, "polished", "yellow", "boots", 4, pabRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 研磨された水晶の剣
        else if (rfbcsRepair) {
            const result = refinedSwordRepair(boxChestValues, "blue", rfbcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfrcsRepair) {
            const result = refinedSwordRepair(boxChestValues, "red", rfrcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfgcsRepair) {
            const result = refinedSwordRepair(boxChestValues, "green", rfgcsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfycsRepair) {
            const result = refinedSwordRepair(boxChestValues, "yellow", rfycsRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 研磨された水晶のツルハシ
        else if (rfbcpRepair) {
            const result = refinedPickAxeRepair(boxChestValues, "blue", rfbcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfrcpRepair) {
            const result = refinedPickAxeRepair(boxChestValues, "red", rfrcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfgcpRepair) {
            const result = refinedPickAxeRepair(boxChestValues, "green", rfgcpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfycpRepair) {
            const result = refinedPickAxeRepair(boxChestValues, "yellow", rfycpRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 研磨された水晶の斧
        else if (rfbcaRepair) {
            const result = refinedAxeRepair(boxChestValues, "blue", rfbcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfrcaRepair) {
            const result = refinedAxeRepair(boxChestValues, "red", rfrcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfgcaRepair) {
            const result = refinedAxeRepair(boxChestValues, "green", rfgcaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfycaRepair) {
            const result = refinedAxeRepair(boxChestValues, "yellow", rfycaRepair[1][0][1])
            if (!result) return;
            dimension.spawnItem(result, block.center());
        }

        // 磨かれた水晶の防具
        else if (rfahRepair) {
            const result = crystalToolRepair(boxChestValues, "refined", "green", "helmet", 4, rfahRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfacRepair) {
            const result = crystalToolRepair(boxChestValues, "refined", "blue", "chestplate", 4, rfacRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfalRepair) {
            const result = crystalToolRepair(boxChestValues, "refined", "red", "leggings", 4, rfalRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else if (rfabRepair) {
            const result = crystalToolRepair(boxChestValues, "refined", "yellow", "boots", 4, rfabRepair[1][0][1]);
            if (!result) return;
            dimension.spawnItem(result, block.center());
        } else return

        dimension.playSound("crystaling_polished", block.center());
        dimension.spawnParticle("cb2:crystalenctable_use", block.center());
        
    }
}