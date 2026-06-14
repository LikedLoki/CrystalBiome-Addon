import { system, ItemStack, world, Block, Vector3, Dimension, BlockCustomComponent, Container, Player } from "@minecraft/server";
import { sleep } from "./other"
import { packingBoxList } from "./packing_box";

export type LocationName = `${string}|${string}|${string}`;
type FurnaceInfo = {
    [loc: LocationName]: {
        id: number,
        dim: number
    }
};
type PackingInfo = {
    is: boolean,
    block?: Block,
    qty: number
};
export type FurnaceContext = {
    dimension: Dimension,
    block: Block,
    locName: LocationName,
    aboveBlock: Block
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

const blockResultMap = {
    "cb2:crystal_block": "cb2:clear_crystal_block",
    "cb2:red_crystal_block": "cb2:clear_red_crystal_block",
    "cb2:green_crystal_block": "cb2:clear_green_crystal_block",
    "cb2:yellow_crystal_block": "cb2:clear_yellow_crystal_block",
    "cb2:crysteel_material": "cb2:crysteel_ingot",
    "cb2:crystalcap_item": "cb2:baked_crystalcap_item",
    "cb2:crystal_packing_box": "cb2:$exception",
    "cb2:red_crystal_packing_box": "cb2:$exception",
    "cb2:green_crystal_packing_box": "cb2:$exception",
    "cb2:yellow_crystal_packing_box": "cb2:$exception"
} as const;

const packingSecondsMap: Record<string, number> = {
    "cb2:crystal_packing_box": 80,
    "cb2:red_crystal_packing_box": 40,
    "cb2:green_crystal_packing_box": 120,
    "cb2:yellow_crystal_packing_box": 20
};

const errorThrow = (as: Player, condition: boolean, message: string): boolean => {
    if (condition) as.sendMessage(`§7${message}`);
    return condition;
};

const stepStateFn = (times: number): number[] => [1, 2, 3, 4].map(dataI => dataI === 4 ? times : Math.round((times * dataI) / 4));

const parseLocName = (locName: LocationName): Vector3 => {
    const [x, y, z] = locName.split("|");
    return {
        x: parseInt(x, 36),
        y: parseInt(y, 36),
        z: parseInt(z, 36),
    }
}
const buildLocName = (location: Vector3): LocationName => `${location.x.toString(36)}|${location.y.toString(36)}|${location.z.toString(36)}`;
const buildFCtx = (dimension: Dimension, block: Block, locName: LocationName, aboveBlock: Block): FurnaceContext => {
    return { dimension: dimension, block: block, locName: locName, aboveBlock: aboveBlock };
}

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

const furnaceCheck = (player: Player) => {
    const conditions = (belowBlock: Block, aboveBlock: Block): boolean => {
        const hasFlare: boolean = belowBlock.typeId === "cb2:flare_crystal_block";
        const isAllowBlock: boolean = aboveBlock.typeId in blockResultMap;
        if (errorThrow(player, !hasFlare, "燃料がありません")) return false;
        if (errorThrow(player, aboveBlock.isAir, "上に精錬するブロックを置いてください")) return false;
        else if (errorThrow(player, !isAllowBlock, "このブロックは精錬出来ません。")) return false;
        return true;
    };
    const packingBox = (aboveBlock: Block): PackingInfo | undefined => {
        const packingInfo: PackingInfo = {
            "is": aboveBlock.hasTag("cb2:packing"),
            "qty": packingBoxList[buildLocName(aboveBlock.location)]?.bef.qty ?? 0
        };
        if (packingInfo.is) {
            const hasContent: boolean = packingInfo.qty > 0;
            if (errorThrow(player, !hasContent, "仕込み箱に何かを入れてください")) return undefined;
        }
        return packingInfo;
    };
    return {
        conditions: conditions,
        packingBox: packingBox
    } as const
};

const furnaceFuelConsum = (dimension: Dimension, belowBlock: Block): void => {
    const fuelLevel: number = belowBlock.permutation.getState("cb2:fuel" as any);
    if (Math.random() < 0.8) {
        if (fuelLevel > 0) belowBlock.setPermutation(belowBlock.permutation.withState("cb2:fuel" as any, fuelLevel - 1));
        if (fuelLevel <= 0) dimension.setBlockType(belowBlock.location, "cb2:deep_crystal_block");
    }
};

export const smeltingEnd = (fCtx: FurnaceContext, success: boolean) => {
    const { dimension, block, locName, aboveBlock } = fCtx;
    if (success) {
        const nextTypeId: string = blockResultMap[aboveBlock.typeId as keyof typeof blockResultMap];
        if (nextTypeId !== "cb2:$exception") dimension.setBlockType(aboveBlock.location, nextTypeId);
    }
    block.setPermutation(block.permutation.withState("cb2:flame" as any, false));
    dimension.playSound("random.fizz", block.center(), { volume: 0.8, pitch: 1 });
    delete furnaceList[locName];
};

const smeltingTimer = async (fCtx: FurnaceContext, timeout: number) => {
    const { dimension, block, locName } = fCtx;
    for (let tick = 0; tick < timeout; tick++) {
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

const packingBoxControl = (loopCount: number, stepTimes: number[] | undefined, countI: number, aboveBlock: Block) => {
    if (stepTimes?.includes(countI)) {
        const currState: number = aboveBlock.permutation.getState("cb2:packing_state" as any);
        console.log(currState, stepTimes)
        const setState: number = stepTimes?.lastIndexOf(countI) === 3 ? 5 : currState + 1
        try { aboveBlock.setPermutation(aboveBlock.permutation.withState("cb2:packing_state" as any, setState)); } catch(e) {console.error("詳細エラー: " + JSON.stringify(e, Object.getOwnPropertyNames(e)));}
    }
    packingBoxList[buildLocName(aboveBlock.location)].bef.qty--;
    packingBoxList[buildLocName(aboveBlock.location)].aft.qty++;
    console.log(packingBoxList)
}
const smeltingProgress = async (fCtx: FurnaceContext, packingInfo: PackingInfo) => {
    const { dimension, block, aboveBlock } = fCtx;
    const loopCount: number = packingInfo.is ? packingInfo.qty : 1;
    const timeout: number = packingSecondsMap[aboveBlock.typeId ?? ""] ?? 80;
    const stepTimes: number[] | undefined = packingInfo.is ? stepStateFn(loopCount) : undefined;
    for (let countI = 1; countI <= loopCount; countI++) {
        dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
        await smeltingTimer(fCtx, timeout);
        if (packingInfo.is) packingBoxControl(loopCount, stepTimes, countI, aboveBlock)
    }
    if (block.above()?.typeId !== aboveBlock.typeId) smeltingEnd(fCtx, false);
    smeltingEnd(fCtx, true);
};

const smeltingStart = (fCtx: FurnaceContext, packingInfo: PackingInfo): void => {
    const { dimension, block, aboveBlock, locName } = fCtx;
    furnaceList[locName] = { id: 0, dim: 0 };
    furnaceList[locName].id = Object.keys(blockResultMap).indexOf(aboveBlock.typeId);
    furnaceList[locName].dim = dimensionList.indexOf(dimension.id);
    block.setPermutation(block.permutation.withState("cb2:flame" as any, true));
    if (packingInfo.is) aboveBlock.setPermutation(aboveBlock.permutation.withState("cb2:packing_state" as any, 2));

    smeltingProgress(fCtx, packingInfo);
};

export const CrystalFurnace: BlockCustomComponent = {
    onPlayerInteract({ dimension, player, block }) {
        if (!player) return

        const FurnaceCk = furnaceCheck(player);
        const elements: GetEl | undefined = furnaceGetElements(block);
        if (!elements) return;

        const { belowBlock, aboveBlock } = elements;
        if (!FurnaceCk.conditions(belowBlock, aboveBlock)) return;

        const packingInfo: PackingInfo | undefined = FurnaceCk.packingBox(aboveBlock);
        if (!packingInfo) return;

        furnaceFuelConsum(dimension, block);
        const locName: LocationName = buildLocName(block.location);
        const fCtx: FurnaceContext = buildFCtx(dimension, block, locName, aboveBlock);

        smeltingStart(fCtx, packingInfo);
    },
    onPlace({ block }) {
        const belowBlock: Block | undefined = block.below();
        if (!belowBlock || belowBlock.typeId !== "cb2:flare_crystal_block") return;
        belowBlock.setPermutation(belowBlock.permutation.withState("cb2:powered" as any, true).withState("cb2:fuel" as any, 15));
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

        if (!getBlock || getBlock.typeId !== "cb2:crystal_furnace") continue;
        if (!aboveBlock || !(aboveBlock.typeId in blockResultMap)) continue;
        const locName: LocationName = buildLocName(getBlock.location);
        const packingInfo: PackingInfo = { is: aboveBlock.hasTag("cb2:packing"), qty: packingBoxList[buildLocName(aboveBlock.location)]?.bef.qty ?? 0 };
        const fCtx: FurnaceContext = { dimension: dimension, block: getBlock, aboveBlock: aboveBlock, locName: locName };
        smeltingProgress(fCtx, packingInfo);
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
        if (!aboveBlock || !(aboveBlock.typeId in blockResultMap)) return;
        furnaceUnloadList.splice(furnaceUnloadList.indexOf(dataI));
        const locName: LocationName = buildLocName(getBlock.location);
        const packingInfo: PackingInfo = { is: aboveBlock.hasTag("cb2:packing"), qty: packingBoxList[buildLocName(aboveBlock.location)]?.bef.qty ?? 0 };
        const fCtx: FurnaceContext = { dimension: dimension, block: getBlock, aboveBlock: aboveBlock, locName: locName };
        smeltingProgress(fCtx, packingInfo);
    }
}, 160);
system.beforeEvents.shutdown.subscribe(() => {
    world.setDynamicProperty("cb2:furnace_list", JSON.stringify(furnaceList));
    world.setDynamicProperty("cb2:furnace_unload_list", JSON.stringify(furnaceUnloadList));
})