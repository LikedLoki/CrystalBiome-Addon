import { EntityDieAfterEvent, EntityHitEntityAfterEvent, EntityHurtAfterEvent, ItemStack, Player, PlayerBreakBlockAfterEvent, system } from "@minecraft/server";
import { CrystColor, CrystRank, translateMap } from "./crystal-biome";

type CrystalSwordTypeId = typeof crystalSwordList[number]
type CrystalSword = ItemStack & { typeId: CrystalSwordTypeId }
type CrystalToolsTypeId = typeof crystalToolsList[number]
type CrystalTools = ItemStack & { typeId: CrystalToolsTypeId }

const crystalSwordList = [
    "cb2:rough_blue_crystal_sword",
    "cb2:rough_red_crystal_sword",
    "cb2:rough_green_crystal_sword",
    "cb2:rough_yellow_crystal_sword",
    "cb2:polished_blue_crystal_sword",
    "cb2:polished_red_crystal_sword",
    "cb2:polished_green_crystal_sword",
    "cb2:polished_yellow_crystal_sword",
    "cb2:refined_blue_crystal_sword",
    "cb2:refined_red_crystal_sword",
    "cb2:refined_green_crystal_sword",
    "cb2:refined_yellow_crystal_sword"
] as const;
const isCrystalSword = (item: ItemStack): item is CrystalSword => crystalSwordList.includes(item.typeId as CrystalSwordTypeId)

const crystalToolsList = [
    "cb2:rough_blue_crystal_axe",
    "cb2:rough_red_crystal_axe",
    "cb2:rough_green_crystal_axe",
    "cb2:rough_yellow_crystal_axe",
    "cb2:polished_blue_crystal_axe",
    "cb2:polished_red_crystal_axe",
    "cb2:polished_green_crystal_axe",
    "cb2:polished_yellow_crystal_axe",
    "cb2:refined_blue_crystal_axe",
    "cb2:refined_red_crystal_axe",
    "cb2:refined_green_crystal_axe",
    "cb2:refined_yellow_crystal_axe",
    "cb2:rough_blue_crystal_pickaxe",
    "cb2:rough_red_crystal_pickaxe",
    "cb2:rough_green_crystal_pickaxe",
    "cb2:rough_yellow_crystal_pickaxe",
    "cb2:polished_blue_crystal_pickaxe",
    "cb2:polished_red_crystal_pickaxe",
    "cb2:polished_green_crystal_pickaxe",
    "cb2:polished_yellow_crystal_pickaxe",
    "cb2:refined_blue_crystal_pickaxe",
    "cb2:refined_red_crystal_pickaxe",
    "cb2:refined_green_crystal_pickaxe",
    "cb2:refined_yellow_crystal_pickaxe"
] as const;
const isCrystalTools = (item: ItemStack): item is CrystalTools => crystalToolsList.includes(item.typeId as CrystalToolsTypeId)

const divisorMap = {
    // 粗い
    "rough": 400,
    // 磨かれた
    "polished": 800,
    // 研磨された
    "refined": 1600
} as const;

export const ToolSkillLevel = {
    sword: (event: EntityHurtAfterEvent) => {
        // ダメージを与えたエンティティがプレイヤーでないなら、切り返す。
        const { damageSource: { damagingEntity } } = event;
        if (!damagingEntity || !(damagingEntity instanceof Player)) return;

        // プレイヤーのコンテナが存在しないか、攻撃に使用したアイテムが水晶の剣でないなら、切り返す。
        const container = damagingEntity.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(damagingEntity.selectedSlotIndex)
        if (!container || !item || !isCrystalSword(item)) return;

        // 現在の修練度を元に、次の値を定義し、説明文を構築する。
        const swordSkill = +(item.getDynamicProperty("cb2:crystal_tools_skill") || 0);
        const nextSwordSkill = swordSkill + 1;
        const swordText = `§r§7| 修練度 -> ${nextSwordSkill}`;

        // 次の修練度、説明文を実体に反映する。
        item.setDynamicProperty("cb2:crystal_tools_skill", nextSwordSkill);
        item.setLore([swordText])
        container.setItem(damagingEntity.selectedSlotIndex, item)
    },
    tools: (event: PlayerBreakBlockAfterEvent) => {
        // プレイヤーのコンテナが存在しないか、採掘に使用したアイテムが水晶のツールでないなら、切り返す。
        const { player } = event;
        const container = player.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(player.selectedSlotIndex)
        if (!container || !item || !isCrystalTools(item)) return;

        // 現在の修練度を元に、次の値を定義し、説明文を構築する。
        const toolsSkill = +(item.getDynamicProperty("cb2:crystal_tools_skill") || 0);
        const nextToolsSkill = toolsSkill + 1;
        const toolsText = `§r§7| 修練度 -> ${nextToolsSkill}`;
        
        // 次の修練度、説明文を実体に反映する。
        item.setDynamicProperty("cb2:crystal_tools_skill", nextToolsSkill);
        item.setLore([toolsText])
        container.setItem(player.selectedSlotIndex, item)
    }
}

export const CrystalGemDrop = {
    sword: (event: EntityDieAfterEvent) => {
        const { damageSource: { damagingEntity: player }, deadEntity } = event;
        if (!player || !(player instanceof Player)) return;

        const container = player.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(player.selectedSlotIndex)
        if (!container || !item || !isCrystalSword(item)) return;

        const typeId = item.typeId.replace("cb2:", "").split("_");
        const swordColor = typeId[1] as CrystColor; 
        const swordRank = typeId[0] as CrystRank;
        const divisor = divisorMap[swordRank] / 2;
        const swordSkill = +(item.getDynamicProperty("cb2:crystal_tools_skill") || 0);
        const percentage = swordSkill / divisor
        const dropAmount = Math.floor(percentage) + (Math.random() < percentage ? 1 : 0)
        if (dropAmount <= 0) return;
        deadEntity.dimension.spawnItem(new ItemStack(`cb2:${swordColor}_crystal_gem`, dropAmount), player.location);
    },
    tools: (event: PlayerBreakBlockAfterEvent) => {
        const { player, block } = event;
        const container = player.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(player.selectedSlotIndex)
        if (!container || !item || !isCrystalTools(item)) return;

        const typeId = item.typeId.replace("cb2:", "").split("_");
        const toolsColor = typeId[1] as CrystColor;
        const toolsRank = typeId[0] as CrystRank;
        const divisor = divisorMap[toolsRank];
        const toolsSkill = +(item.getDynamicProperty("cb2:crystal_tools_skill") || 0);
        const percentage = toolsSkill / divisor
        const dropAmount = Math.floor(percentage) + (Math.random() < percentage ? 1 : 0)
        console.log(percentage, dropAmount, (percentage / divisor % 1))
        if (dropAmount <= 0) return;
        block.dimension.spawnItem(new ItemStack(`cb2:${toolsColor}_crystal_gem`, dropAmount), block.location);
    }
}