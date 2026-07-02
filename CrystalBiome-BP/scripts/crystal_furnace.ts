import { system, ItemStack, world, Block, Vector3, Dimension, BlockCustomComponent, Container, Player, BlockCustomComponentInstance } from "@minecraft/server";
import { sleep } from "./other"
import { BoxInfo } from "./box_in_chest";

export type LocationName = `${string}|${string}|${string}`;
type FurnaceInfo = {
    [loc: LocationName]: {
        id: number,
        dim: number
    }
};
type BoxChest = {
    props: BlockCustomComponentInstance | undefined,
    boxInfo: BoxInfo | undefined
};
export type FurnaceContext = {
    dimension: Dimension,
    block: Block,
    locName: LocationName,
    aboveBlock: Block,
    belowBlock: Block
};
type GetEl = {
    belowBlock: Block,
    aboveBlock: Block,
}


let furnaceList: FurnaceInfo = {};
export let furnaceUnloadList: string[] = [];

const dimensionList: string[] = [
    "minecraft:overworld", "minecraft:nether", "minecraft:the_end"
];

const resultMap = {
    "cb2:crystal_block": "cb2:clear_crystal_block",
    "cb2:red_crystal_block": "cb2:clear_red_crystal_block",
    "cb2:green_crystal_block": "cb2:clear_green_crystal_block",
    "cb2:yellow_crystal_block": "cb2:clear_yellow_crystal_block",
    "cb2:crysteel_material": "cb2:crysteel_ingot",
    "cb2:crystalcap_item": "cb2:baked_crystalcap_item",
    "cb2:ice_crystal_block": "cb2:progress_ice_crystal_block",
    "cb2:crystal_box_in_chest": "cb2:$exception",
    "cb2:red_crystal_box_in_chest": "cb2:$exception",
    "cb2:green_crystal_box_in_chest": "cb2:$exception",
    "cb2:yellow_crystal_box_in_chest": "cb2:$exception"
} as const;

const packingTickMap: Record<string, number> = {
    "cb2:crystal_box_in_chest": 80,
    "cb2:red_crystal_box_in_chest": 40,
    "cb2:green_crystal_box_in_chest": 120,
    "cb2:yellow_crystal_box_in_chest": 1
};

const errorThrow = (as: Player, condition: boolean, message: string): boolean => {
    if (condition) as.sendMessage(`§7${message}`);
    return condition;
};

const parseLocName = (locName: LocationName): Vector3 => {
    const [x, y, z] = locName.split("|");
    return {
        x: parseInt(x, 36),
        y: parseInt(y, 36),
        z: parseInt(z, 36),
    }
}
const buildLocName = (location: Vector3): LocationName => `${location.x.toString(36)}|${location.y.toString(36)}|${location.z.toString(36)}`;
const buildFCtx = (dimension: Dimension, block: Block, locName: LocationName, aboveBlock: Block, belowBlock: Block): FurnaceContext => {
    return { dimension: dimension, block: block, locName: locName, aboveBlock: aboveBlock, belowBlock: belowBlock };
};

const furnaceGetElements = (block: Block): GetEl | undefined => {
    const belowBlock: Block | undefined = block.below();
    const aboveBlock: Block | undefined = block.above();
    const furnaceState: boolean | undefined = block.permutation.getState("cb2:flame" as any);
    if (!aboveBlock || !belowBlock || furnaceState === undefined || furnaceState === true) return;
    return {
        belowBlock: belowBlock,
        aboveBlock: aboveBlock
    };
}

const checkConditions = (player: Player, belowBlock: Block, aboveBlock: Block, boxChest: BoxChest): boolean => {
        const hasFlare: boolean = belowBlock.typeId === "cb2:flare_crystal_block";
        const isAllowBlock: boolean = aboveBlock.typeId in resultMap;
        if (errorThrow(player, !hasFlare, "燃料がありません")) return false;
        if (errorThrow(player, aboveBlock.isAir, "上に精錬するブロックを置いてください")) return false;
        else if (errorThrow(player, !isAllowBlock, "このブロックは精錬出来ません。")) return false;
        if (boxChest.props && boxChest.boxInfo && errorThrow(player, boxChest.boxInfo.before.quantity <= 0, "仕込み箱に何か入れてください")) return false;
        return true;
    };

const furnaceFuelConsum = (dimension: Dimension, belowBlock: Block): void => {
    const fuelLevel: number = belowBlock.permutation.getState("cb2:fuel" as any);
    if (Math.random() < 0.8) {
        dimension.spawnParticle("cb2:powered_flare", belowBlock.center());
        if (fuelLevel > 0) belowBlock.setPermutation(belowBlock.permutation.withState("cb2:fuel" as any, fuelLevel - 1));
        if (fuelLevel <= 0) dimension.setBlockType(belowBlock.location, "cb2:deep_crystal_block");
    }
};

export const smeltingEnd = (fCtx: FurnaceContext, success: boolean) => {
    const { dimension, block, locName, aboveBlock } = fCtx;
    if (success) {
        const nextTypeId: string = resultMap[aboveBlock.typeId as keyof typeof resultMap];
        console.log(aboveBlock.typeId, nextTypeId);
        if (nextTypeId !== "cb2:$exception") dimension.setBlockType(aboveBlock.location, nextTypeId);
    }
    block.setPermutation(block.permutation.withState("cb2:flame" as any, false));
    dimension.playSound("random.fizz", block.center(), { volume: 0.8, pitch: 1 });
    delete furnaceList[locName];
};

const smeltingTimer = async (fCtx: FurnaceContext, timeout: number) => {
    const { dimension, block, locName, belowBlock } = fCtx;
    for (let tick = 0; tick < (timeout / 2); tick++) {
        if (belowBlock.typeId !== "cb2:flare_crystal_block") {
            smeltingEnd(fCtx, false);
            break;
        }
        try {
            if (!block.permutation.getState("cb2:flame" as any)) {
                smeltingEnd(fCtx, false);
                return;
            }
            await sleep(2);
        } catch (error) {
            furnaceUnloadList.push(locName + `|${dimensionList.indexOf(dimension.id)}`);
            break;
        }
    }
};

const smeltingProgress = async (fCtx: FurnaceContext, boxChest: BoxChest) => {
    const { dimension, block, aboveBlock, belowBlock } = fCtx;
    const loopCount: number = boxChest.boxInfo?.before?.quantity ?? 1;
    const timeout: number = packingTickMap[aboveBlock.typeId ?? ""] ?? 80;
    for (let countI = 1; countI <= loopCount; countI++) {
         
        if (countI !== 1) furnaceFuelConsum(dimension, belowBlock);
        dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
        await smeltingTimer(fCtx, timeout);
        if (boxChest.props && boxChest.boxInfo) {
            const getInfo: BoxInfo = JSON.parse(boxChest.props.get("cb2:box_in_chest"));
            const newInfo: BoxInfo = {
                "before": {
                    "itemId": getInfo.before.itemId,
                    "quantity": getInfo.before.quantity - 1
                },
                "after": {
                    "itemId": getInfo.after.itemId,
                    "quantity": getInfo.after.quantity + 1
                }
            };
            boxChest.props.set("cb2:box_in_chest", JSON.stringify(newInfo))
        }
    }
    if (block.above()?.typeId !== aboveBlock.typeId) smeltingEnd(fCtx, false);
    smeltingEnd(fCtx, true);
};

const smeltingStart = (fCtx: FurnaceContext, boxChest: BoxChest): void => {
    const { dimension, block, aboveBlock, locName } = fCtx;
    furnaceList[locName] = { id: 0, dim: 0 };
    furnaceList[locName].id = Object.keys(resultMap).indexOf(aboveBlock.typeId);
    furnaceList[locName].dim = dimensionList.indexOf(dimension.id);
    block.setPermutation(block.permutation.withState("cb2:flame" as any, true));

    smeltingProgress(fCtx, boxChest);
};

export const CrystalFurnace: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return

        const elements: GetEl | undefined = furnaceGetElements(block);
        if (!elements) return;

        const { belowBlock, aboveBlock } = elements;
        const isBoxChest = aboveBlock.getComponent("minecraft:dynamic_properties");
        const boxChest: BoxChest = {
            "props": isBoxChest,
            "boxInfo": JSON.parse(isBoxChest?.get("cb2:box_in_chest") ?? "[]") || undefined
        };
        if (!checkConditions(player, belowBlock, aboveBlock, boxChest)) return;

        furnaceFuelConsum(dimension, block);
        
        const locName: LocationName = buildLocName(block.location);
        const fCtx: FurnaceContext = buildFCtx(dimension, block, locName, aboveBlock, belowBlock);

        smeltingStart(fCtx, boxChest);
    },
    onPlace({ block, dimension }) {
        const belowBlock: Block | undefined = block.below();
        if (!belowBlock || belowBlock.typeId !== "cb2:flare_crystal_block") return;
        belowBlock.setPermutation(belowBlock.permutation.withState("cb2:powered" as any, true).withState("cb2:fuel" as any, 15));
        dimension.spawnParticle("cb2:powered_flare", belowBlock.center());
    }
};



system.run(async () => {
    //world.setDynamicProperty("cb2:furnace_list", "{}");
    while (!world.getAllPlayers()[0]) await sleep(20);
    const player: Player = world.getAllPlayers()[0];
    while (!player.dimension.getBlock(player.location)) await sleep(20);
    const getList = world.getDynamicProperty("cb2:furnace_list");
    const getUnloadList = world.getDynamicProperty("cb2:furnace_unload_list");
    if (!getList || typeof getList !== "string") return;
    furnaceList = JSON.parse(getList);
    furnaceUnloadList = JSON.parse(getUnloadList as string ?? "");

    for (const [keyI, valueI] of Object.entries(furnaceList)) {
        const location: Vector3 = parseLocName(keyI as LocationName);
        const dimension: Dimension = world.getDimension(dimensionList[valueI.dim]);
        const getBlock: Block | undefined = dimension.getBlock(location);
        const aboveBlock: Block | undefined = getBlock?.above();
        const belowBlock: Block | undefined = getBlock?.below();

        if (!getBlock || getBlock.typeId !== "cb2:crystal_furnace") continue;
        if (!aboveBlock || !(aboveBlock.typeId in resultMap)) continue;
        if (!belowBlock || belowBlock.typeId !== "cb2:flare_crystal_block") continue;
        const isBoxChest = aboveBlock.getComponent("minecraft:dynamic_properties");
        const boxChest: BoxChest = {
            "props": isBoxChest,
            "boxInfo": JSON.parse(isBoxChest?.get("cb2:box_in_chest") ?? "[]") || undefined
        }
        const locName: LocationName = buildLocName(getBlock.location);
        const fCtx: FurnaceContext = { dimension: dimension, block: getBlock, aboveBlock: aboveBlock, locName: locName, belowBlock: belowBlock };
        smeltingProgress(fCtx, boxChest);
    }
});
system.runInterval(() => {
    if (furnaceUnloadList.length < 1) return;
    for (const dataI of furnaceUnloadList) {
        const [x, y, z, dim] = dataI.split("|");
        const location: Vector3 = parseLocName([x, y, z].join("|") as LocationName);
        const dimension: Dimension = world.getDimension(dimensionList[+dim]);
        const getBlock: Block | undefined = dimension.getBlock(location);
        if (!getBlock) return;
        if (getBlock.typeId !== "cb2:crystal_furnace") {
            furnaceUnloadList.splice(furnaceUnloadList.indexOf(dataI));
            return;
        }
        const aboveBlock: Block | undefined = getBlock.above();
        const belowBlock: Block | undefined = getBlock?.below();
        if (!belowBlock || belowBlock.typeId !== "cb2:flare_crystal_block") continue;
        if (!aboveBlock || !(aboveBlock.typeId in resultMap)) return;
        furnaceUnloadList.splice(furnaceUnloadList.indexOf(dataI));
        const isBoxChest = aboveBlock.getComponent("minecraft:dynamic_properties");
        const boxChest: BoxChest = {
            "props": isBoxChest,
            "boxInfo": JSON.parse(isBoxChest?.get("cb2:box_in_chest") ?? "[]") || undefined
        }
        const locName: LocationName = buildLocName(getBlock.location);
        const fCtx: FurnaceContext = { dimension: dimension, block: getBlock, aboveBlock: aboveBlock, locName: locName, belowBlock: belowBlock };
        smeltingProgress(fCtx, boxChest);
    }
}, 160);
system.beforeEvents.shutdown.subscribe(() => {
    world.setDynamicProperty("cb2:furnace_list", JSON.stringify(furnaceList));
    world.setDynamicProperty("cb2:furnace_unload_list", JSON.stringify(furnaceUnloadList));
})