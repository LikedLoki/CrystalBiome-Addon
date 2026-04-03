import { system, ItemStack, world, Block, Vector3, Dimension, BlockCustomComponent, Container } from "@minecraft/server";

function getFurnaceList(): string[] {
    const rawData: any | undefined = world.getDynamicProperty("cb2:furnace");
    return rawData ? JSON.parse(rawData) : [];
}

function setFurnaceList(list: string[]) {
    world.setDynamicProperty("cb2:furnace", JSON.stringify(list));
}

const fOffset: { [rot: string]: { x: number, z: number } } = {
    east: { x: -1, z: 0 }, west: { x: 1, z: 0 }, south: { x: 0, z: -1 }, north: { x: 0, z: 1 }
}

const zyuyouteki: { [inid: string]: { output: string, tick: number } } = {
    "cb2:crystal_block": { output: "cb2:clear_crystal_block", tick: 120 },
    "cb2:red_crystal_block": { output: "cb2:clear_red_crystal_block", tick: 120 },
    "cb2:green_crystal_block": { output: "cb2:clear_green_crystal_block", tick: 120 },
    "cb2:yellow_crystal_block": { output: "cb2:clear_yellow_crystal_block", tick: 120 },
    "cb2:crysteel_material": { output: "cb2:crysteel_ingot", tick: 120 },
    "cb2:crystalcap_item": { output: "cb2:baked_crystalcap_item", tick: 120 }
};

const itemMap: string[] = [
    "cb2:crystal_block",
    "cb2:red_crystal_block",
    "cb2:green_crystal_block",
    "cb2:yellow_crystal_block",
    "cb2:crysteel_material",
    "cb2:crystalcap_item"
];

export function getMapIndex(block: Block): number {
    const a = block.permutation.getState("cb2:let_a" as any) ?? 0;
    const b = block.permutation.getState("cb2:let_b" as any) ?? 0;
    return (a + b * 16);
}

function setMapIndex(index: number): { a: number, b: number } {
    return {
        a: index % 16,
        b: Math.floor(index / 16)
    }
}

function removeList(loc: Vector3) {
    const blockKey: string = `${loc.x}=${loc.y}=${loc.z}`;
    let list: string[] = getFurnaceList();
    list = list.filter(key => key !== blockKey);
    setFurnaceList(list);
}

function fuelProcess(pos: Vector3, dimension: Dimension, playSound: boolean) {
    const block: Block | undefined = dimension.getBlock(pos);
    if (!block || block.typeId !== "cb2:crystal_furnace") return;
    const below: Block | undefined = dimension.getBlock({ x: pos.x, y: pos.y - 1, z: pos.z });
    if (!below) return;
    const fuel: number = below.permutation.getState("cb2:fuel" as any) ?? 0;
    const itemIndex: number = getMapIndex(block);
    const itemTypeId: string = itemMap[itemIndex];
    const config: { output: string, tick: number } = zyuyouteki[itemTypeId];
    if (!config) return;
    //保存
    const blockKey: string = `${pos.x}=${pos.y}=${pos.z}`;
    let list: string[] = getFurnaceList();
    if (!list.includes(blockKey)) {
        list.push(blockKey);
        setFurnaceList(list);
    }

    if (playSound) {
        dimension.playSound("mob.blaze.shoot", block.center(), { volume: 1, pitch: 2 });
    }

    system.runTimeout(() => {
        const ago: Block | undefined = dimension.getBlock(pos);
        if (!ago || ago.typeId !== "cb2:crystal_furnace" || !ago.permutation.getState("cb2:flame" as any) || itemIndex !== getMapIndex(ago)) {
            removeList(pos);
            return;
        }
        //燃料消費
        if (Math.random() < 0.8) {
            if (fuel > 0) {
                below.setPermutation(below.permutation.withState("cb2:fuel" as any, fuel - 1));
            } else {
                dimension.setBlockType(below.location, "cb2:deep_crystal_block");
            }
        }

        //アイテム排出
        const facing: string | undefined = ago.permutation.getState("minecraft:cardinal_direction");
        if (!facing) return;
        const fos: { x: number, z: number } = fOffset[facing];
        const resultItem: ItemStack = new ItemStack(config.output, 1);
        const outLoc: Vector3 = { x: pos.x + 0.5 + fos.x, y: pos.y, z: pos.z + 0.5 + fos.z };

        dimension.spawnItem(resultItem, outLoc);
        dimension.spawnParticle("cb2:crystal_furnace_output", outLoc)
        dimension.playSound("random.fizz", ago.center(), { volume: 0.8, pitch: 1 });

        const currCount: number = ago.permutation.getState("cb2:itemcount" as any);
        const nextCount: number = currCount - 1;
        const isFlare: boolean = dimension.getBlock(below.location)?.typeId === "cb2:flare_crystal_block";

        if (currCount > 0 && isFlare) {
            //継続
            ago.setPermutation(ago.permutation.withState("cb2:itemcount" as any, nextCount));
            fuelProcess(pos, dimension, true);
        } else {
            //終了
            ago.setPermutation(ago.permutation
                .withState("cb2:let_a" as any, 0)
                .withState("cb2:let_b" as any, 0)
                .withState("cb2:itemcount" as any, 0)
                .withState("cb2:flame" as any, false)
            );
            if (!isFlare) {
                dimension.spawnItem(new ItemStack(itemTypeId, currCount), outLoc);
            }
            removeList(pos);
        }
    }, config.tick);
}

const CF: BlockCustomComponent = {
    onPlayerInteract({ block, player, dimension }) {
        if (!player) return;
        const loc: Vector3 = block.location;
        const below: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
        if (below?.typeId !== "cb2:flare_crystal_block") {
            player.sendMessage("§7燃料がありません");
            return;
        };
        const inventory: Container | undefined = player.getComponent("inventory")?.container;
        if (!inventory) return;
        const item: ItemStack | undefined = inventory.getItem(player.selectedSlotIndex);
        if (!item || !zyuyouteki[item.typeId]) {
            player.sendMessage("§7このアイテムは使用できません");
            return;
        };
        const currentIdx: number = getMapIndex(block);
        const itemIndex: number = itemMap.indexOf(item.typeId);
        const isFlashing: boolean = block.permutation.getState("cb2:flame" as any);

        if (isFlashing && currentIdx !== itemIndex) {
            player.sendMessage("§7加工中です");
            return;
        }

        const itemCount: number = block.permutation.getState("cb2:itemcount" as any);
        if (itemCount >= 15) {
            player.sendMessage("§7アイテムが満杯です");
            return;
        }

        //アイテム消費
        const newCount: number = isFlashing ? itemCount + 1 : 0;
        block.setPermutation(block.permutation.withState("cb2:itemcount" as any, newCount));
        if (item.amount > 1) {
            item.amount -= 1;
            inventory.setItem(player.selectedSlotIndex, item);
        } else {
            inventory.setItem(player.selectedSlotIndex, undefined);
        }

        dimension.playSound("random.pop", loc, { pitch: 0.5 });

        if (!isFlashing) {
            const data: { a: number, b: number } = setMapIndex(itemIndex);
            block.setPermutation(block.permutation
                .withState("cb2:let_a" as any, data.a)
                .withState("cb2:let_b" as any, data.b)
                .withState("cb2:flame" as any, true)
            );
            fuelProcess(loc, dimension, true);
        }
    },
    onPlace({ block, dimension }) {
        const below: Block | undefined = dimension.getBlock({ x: block.location.x, y: block.location.y - 1, z: block.location.z });
        if (below?.typeId === "cb2:flare_crystal_block") {
            dimension.spawnParticle("cb2:powered_flare", below.center())
            below.setPermutation(below.permutation.withState("cb2:powered" as any, true).withState("cb2:fuel" as any, 15));
        }
    }
};

//ブロック破壊時
world.beforeEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
    if (block.typeId !== "cb2:crystal_furnace") return;
    if (!block.permutation.getState("cb2:flame" as any)) return;

    const itemTypeId: string = itemMap[getMapIndex(block)];
    const itemCount: number = block.permutation.getState("cb2:itemcount" as any) + 1;
    const drop: ItemStack = new ItemStack(itemTypeId, itemCount);
    const loc: Vector3 = block.location;

    system.run(() => {
        dimension.spawnItem(drop, loc);
        removeList(loc);
    });
});

// ワールド起動時の再開処理
system.runTimeout(() => {
    const list: string[] = getFurnaceList();
    const dimensions: Dimension[] = [
        world.getDimension("overworld"),
        world.getDimension("nether"),
        world.getDimension("the_end")
    ];

    for (const key of list) {
        const [x, y, z]: number[] = key.split("=").map(Number);
        for (const dim of dimensions) {
            const block: Block | undefined = dim.getBlock({ x, y, z });
            if (block?.typeId === "cb2:crystal_furnace" && block.permutation.getState("cb2:flame" as any)) {
                fuelProcess({ x, y, z }, dim, false);
                break; //次へ
            }
        }
    }
    console.log("再起動処理完了");
}, 160);

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:crystal_furnace", CF);
});