import { Block, BlockCustomComponent, Container, Dimension, Entity, ItemCustomComponent, ItemDurabilityComponent, ItemStack, Vector3 } from "@minecraft/server";

const typeIdList = [
    // 水晶の原石
    "cb2:crystal_block",
    "cb2:red_crystal_block",
    "cb2:green_crystal_block",
    "cb2:yellow_crystal_block",
    "cb2:saline_crystal_block",
    "cb2:deep_crystal_block",

    //水晶の芽
    "cb2:blue_crystal_cluster",
    "cb2:red_crystal_cluster",
    "cb2:green_crystal_cluster",
    "cb2:yellow_crystal_cluster",
    "cb2:saline_crystal_cluster",
    "cb2:blue_crystal_bud",
    "cb2:red_crystal_bud",
    "cb2:green_crystal_bud",
    "cb2:yellow_crystal_bud",
    "cb2:saline_crystal_bud",
    
    //その他
    "cb2:orbshard_block",
    "cb2:crystalcap",

    //モブ
    "cb2:crystaling",
    "cb2:crystal_guard",
    "cb2:crystal_wander"
];
const nameList = [
    //水晶の原石
    "ブロック: 蒼水晶の原石",
    "ブロック: 紅水晶の原石",
    "ブロック: 翠水晶の原石",
    "ブロック: 黄水晶の原石",
    "ブロック: 塩晶の原石",
    "ブロック: 深層水晶の原石",

    //水晶の芽
    "ブロック: 蒼水晶の芽",
    "ブロック: 紅水晶の芽",
    "ブロック: 翠水晶の芽",
    "ブロック: 黄水晶の芽",
    "ブロック: 塩晶の芽",
    "ブロック: 蒼水晶の芽(成長途中)",
    "ブロック: 紅水晶の芽(成長途中)",
    "ブロック: 翠水晶の芽(成長途中)",
    "ブロック: 黄水晶の芽(成長途中)",
    "ブロック: 塩晶の芽(成長途中)",

    //その他
    "ブロック: クリスタルオーブの欠片",
    "ブロック: 晶茸",

    //モブ
    "モブ: クリスタリング",
    "モブ: クリスタルガード",
    "モブ: クリスタルワンダー"
];
const loreList = [
    //水晶の原石
    "最も基本的な水晶の一つ。\n大地の大半を青色に染めている。\n上を歩くと、青く星と雫がひらめく。",
    "最も基本的な水晶の一つ。\n大地のクラスターとして赤く生えている。\n上を歩くと、赤く星と雫がひらめく。",
    "最も基本的な水晶の一つ。\n大地に細々と埋まっていて、緑に照らす。\n上を歩くと、緑く星と雫がひらめく。",
    "最も基本的な水晶の一つ。\n大地の乱雑なクラスターとして黄色く生えている。\n上を歩くと加速し、黄色く星と雫がひらめく。",
    "塩分が凝縮された水晶。\n砕いて手に入れた欠片は食べることも。\nおいしい...?",
    "ちょっと硬い地下の水晶。\n長年の間地下に置かれ、炭のように黒くなっている。\n何かを秘めてるかも。",

    //水晶の芽
    "完全に成長した蒼水晶の芽。\nたくましい蒼色に輝いている。\n飾りに最適かもしれない。",
    "完全に成長した紅水晶の芽。\n貫くような紅色に輝いている。\n飾りに最適かもしれない。",
    "完全に成長した翠水晶の芽。\n闇夜を照らすように発光している。\n飾りに最適かもしれない。",
    "完全に成長した黄水晶の芽。\n混沌のごとき黄色に輝いている。\n飾りに最適かもしれない。",
    "完全に成長した塩晶の芽。\n塩分により繊細な薄橙に輝いている。\n食料に最適かもしれない。",
    "まだ成長しきってない蒼水晶の芽。\n今にも崩れそうな蒼色に輝いてる。\n歳月を待つべし。",
    "まだ成長しきってない紅水晶の芽。\n折れてしまいそうな紅色に輝いている。\n歳月を待つべし。",
    "まだ成長しきってない翠水晶の芽。\n弱々しく発光している。\n歳月を待つべし。",
    "まだ成長しきってない黄水晶の芽。\n希望のような黄色に輝いている。\n歳月を待つべし。",
    "まだ成長しきってない塩晶の芽。\n薄く塩分を纏い薄橙に輝いている。\n食べ時ではないようだ。",

    //その他
    "不可思議な力を持つ欠片。\nクリスタルガード/ワンダーを同時に六体まで生み出す。\n何かの鍵になるはず。",
    "色彩豊かな水晶に生える、青白いきのこ。\n無機物に根差した不思議な生態。\n焼くと食べられる。毒物じゃないよ。",

    //モブ
    "つぶらな瞳と、ブロックのような胴体を持った生物。\n全部で蒼紅翠黄希の五色が存在する。\n水晶のきのこが大好き。",
    "水晶の地を護りし者。人型だが、目も顔もない。\nその手にはカラフルな剣が握られており、本人もまたカラフルである。\n全部で蒼紅翠黄の四色が存在する。",
    "水晶の地を徘徊する者。人型?だが、目も顔もない。\n四肢が無く、胴体と水晶の欠片を浮かべる姿は驚異。\n少し足が速く、全部で蒼紅翠黄の四色が存在する。"
];

const selectTarget = (source: Entity): Entity | Block | undefined =>
        source.getEntitiesFromViewDirection({ "maxDistance": 8 })[0]?.entity
        || source.getBlockFromViewDirection({ "maxDistance": 8 })?.block;

const getInfo = (typeId: string): [string, string] | undefined => {
    const indexNum: number = typeIdList.indexOf(typeId);
    const name: string | undefined = nameList[indexNum];
    const lore: string | undefined = loreList[indexNum];
    if (name && lore) return [name, lore];
};
const setShard = (name: string, lore: string) => {
    const newShard: ItemStack = new ItemStack("cb2:knowledge_shard", 1);
    newShard.nameTag = `§r了知の欠片§l<${name}>`;
    newShard.setLore([`§r§7${lore}`])
    return newShard;
}

export const KnowledgeCrystal: ItemCustomComponent = {
    "onUse"({ source, itemStack }) {
        if (!itemStack) return;

        const selected: Entity | Block | undefined = selectTarget(source);
        if (!selected) return;

        const typeId: string = selected instanceof Entity && selected.getComponent("minecraft:item")?.itemStack
            ? selected.getComponent("minecraft:item")!.itemStack.typeId
            : selected.typeId

            console.log(typeId)

        const info = getInfo(typeId);
        if (!info) return;
        const [name, lore] = info;

        source.dimension.spawnItem(setShard(name, lore), selected instanceof Entity ? selected.location : selected.center());
        source.dimension.playSound("random.glass", source.location, { "pitch": 2 });
        source.dimension.playSound("random.glass", source.location, { "pitch": 0.8 });

        const container: Container | undefined = source.getComponent("minecraft:inventory")?.container;
        if (!container) return;

        const mainhand: number = source.selectedSlotIndex;
        const durability: ItemDurabilityComponent | undefined = itemStack.getComponent("minecraft:durability");
        if (!durability) return;
        if (durability.damage + 1 >= durability.maxDurability) {
            container.setItem(mainhand, undefined);
            source.dimension.playSound("random.break", source.location);
        } else {
            durability.damage++;
            container.setItem(mainhand, itemStack);
        }
    }
}