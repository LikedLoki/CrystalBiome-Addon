import { Block, BlockCustomComponent, Container, Dimension, ItemStack, Player, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";

type LocationName = `${string}|${string}|${string}`;
type BoxInfo = {
    dim: number,
    bef: {
        id: number,
        qty: number
    },
    aft: {
        id: BoxInfo["bef"]["id"],
        qty: number
    }
};
type BoxList = {
    [key: LocationName]: BoxInfo
};
type InputTypeId = typeof itemIntoList[number];

export let packingBoxList: BoxList = {};

const itemIntoList = [
    "minecraft:air",
    "cb2:crystal_block",
    "cb2:red_crystal_block",
    "cb2:green_crystal_block",
    "cb2:yellow_crystal_block"
] as const;
const itemOutList = [
    "minecraft:air",
    "cb2:clear_crystal_block",
    "cb2:clear_red_crystal_block",
    "cb2:clear_green_crystal_block",
    "cb2:clear_yellow_crystal_block"
] as const;

const sendError = (as: Player, message: string): void => as.sendMessage(`§7${message}`);
const errorThrow = (as: Player, condition: boolean, message: string) => {
    if (condition) sendError(as, message);
    return condition;
}
const isAllowedItem = (player: Player, itemTypeId: string, message: string): itemTypeId is InputTypeId => {
    if (itemIntoList.includes(itemTypeId as typeof itemIntoList[number])) return true;
    sendError(player, message);
    return false;
};
/*const parseLocName = (locName: LocationName): Vector3 => {
    const [x, y, z] = locName.split("|");
    return {
        x: parseInt(x, 36),
        y: parseInt(y, 36),
        z: parseInt(z, 36),
    }
}*/
const buildLocName = (location: Vector3): LocationName => `${location.x.toString(36)}|${location.y.toString(36)}|${location.z.toString(36)}`;

const writeData = (locName: LocationName, itemId: InputTypeId, setup: boolean) => {
    const boxInfo: BoxInfo = packingBoxList[locName] ?? {};
    boxInfo.bef = setup ? { id: 0, qty: 0 } : { id: itemIntoList.indexOf(itemId), qty: boxInfo.bef.qty + 1 };
    boxInfo.aft = { id: boxInfo.bef.id, qty: boxInfo?.aft?.qty ?? 0 };
    packingBoxList[locName] = boxInfo;
};


export const PackingBox: BlockCustomComponent = {
    onPlayerInteract({ player, block }) {
        if (!player) return;

        const currState: number = block.permutation.getState("cb2:packing_state" as any);
        if (currState === 0) block.setPermutation(block.permutation.withState("cb2:packing_state" as any, 1));
        const greaterState: boolean = currState > 1;
        if (errorThrow(player, greaterState, "精錬中です")) return;

        const inventory: Container | undefined = player.getComponent("inventory")?.container;
        const item: ItemStack | undefined = inventory?.getItem(player.selectedSlotIndex);
        if (!inventory || !item) return;

        if (!isAllowedItem(player, item.typeId, "このアイテムは入れられません")) return;

        const locName: LocationName = buildLocName(block.location);
        const itemIndex: number = itemIntoList.indexOf(item.typeId);
        const isDuplicate: boolean = (packingBoxList[locName]?.bef.id || itemIndex) !== itemIndex;
        if (errorThrow(player, isDuplicate, "既に別のアイテムが入っています")) return;

        writeData(locName, item.typeId, false);
    },
    onPlace({ block }) {
        const locName: LocationName = buildLocName(block.location);
        writeData(locName, "minecraft:air", true);
    },
    onBreak({ dimension, block }) {
        const locName: LocationName = buildLocName(block.location);
        const { bef, aft }: BoxInfo = packingBoxList[locName];
        delete packingBoxList[locName];
        const beforeDropItem: ItemStack | undefined = bef.qty !== 0 ? new ItemStack(itemIntoList[bef.id], bef.qty) : undefined;
        const afterDropItem: ItemStack | undefined = aft.qty !== 0 ? new ItemStack(itemOutList[aft.id], aft.qty) : undefined;
        if (beforeDropItem) dimension.spawnItem(beforeDropItem, block.center());
        if (afterDropItem) dimension.spawnItem(afterDropItem, block.center());
    }
};

system.run(async () => {
    while (!world.getAllPlayers()[0]) await sleep(20);
    const player: Player = world.getAllPlayers()[0];
    while (!player.dimension.getBlock(player.location)) await sleep(20);
    const getList = world.getDynamicProperty("cb2:packing_box_list");
    if (typeof getList !== "string") {
        world.sendMessage("[CrystalBiome-Addon][packing_box] リストの読み込みに失敗しました。"); return;
    };
    packingBoxList = JSON.parse(getList);
})

system.beforeEvents.shutdown.subscribe(() => {
    world.setDynamicProperty("cb2:packing_box_list", JSON.stringify(packingBoxList))
})