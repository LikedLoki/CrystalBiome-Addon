import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent, VectorXZ, CustomComponentParameters } from "@minecraft/server";

interface doorSetting {
    name: string,
    open: string,
    close: string;
};
type FourRot = "east" | "west" | "south" | "north";
type VerticalType = "up" | "down";

class DoorAdmin {
    static breakChain(type: VerticalType, params: doorSetting, block: Block, dimension: Dimension) {
        const { x, y, z } = block.location;
        const targetBlock: Block | undefined = type === "down" ? block.above() : block.below();
        if (!targetBlock || targetBlock.typeId !== (type === "down" ? `cb2:${params.name}_door_up` : `cb2:${params.name}_door_down`)) return;
        dimension.setBlockType({ x: x, y: y + (type === "down" ? 1 : -1), z: z }, "minecraft:air");
    }
    static openTheDoor(type: VerticalType, data: CustomComponentParameters, block: Block, dimension: Dimension) {
        const params: doorSetting = data.params as doorSetting;
        const targetBlock: Block | undefined = type === "down" ? block.below() : block.above();
        const newPerm: number = block.permutation.getState("cb2:open" as any) ? 0 : 1;
        block.setPermutation(block.permutation.withState("cb2:open" as any, newPerm));
        if (targetBlock) targetBlock.setPermutation(targetBlock.permutation.withState("cb2:open" as any, newPerm));
        const openSound: string = params.open ?? "open_door.copper"
        const closeSound: string = params.close ?? "close_door.copper"
        dimension.playSound(newPerm === 1 ? openSound : closeSound, block.location, { volume: 1, pitch: 1 });
    }
}

const offset: Record<string, VectorXZ> = {
    "east": { x: 0, z: -1 },
    "west": { x: 0, z: 1 },
    "south": { x: 1, z: 0 },
    "north": { x: -1, z: 0 }
};
const DoorDown: BlockCustomComponent = {
    onPlace({ block, dimension }, data) {
        const upperBlock: Block | undefined = block.above();
        if (!upperBlock || !upperBlock.isAir) {
            dimension.setBlockType(block.location, "minecraft:air");
            return;
        };
        const { x, y, z } = block.location;
        const params: doorSetting = data.params as doorSetting;
        dimension.setBlockType({ x: x, y: y + 1, z: z }, `cb2:${params.name}_door_up`);
        const facing: FourRot = block.permutation.getState("minecraft:cardinal_direction") as FourRot;
        upperBlock.setPermutation(upperBlock.permutation.withState("minecraft:cardinal_direction", facing));
        const sideBlock: Block | undefined = dimension.getBlock({ x: x + offset[facing].x, y: y, z: z + offset[facing].z });
        if (!sideBlock || sideBlock.typeId !== `cb2:${params.name}_door_down`) return;
        block.setPermutation(block.permutation.withState("cb2:revers" as any, 1));
        upperBlock.setPermutation(upperBlock.permutation.withState("cb2:revers" as any, 1));
    },
    onBreak({ block, dimension }, data) {
        const params: doorSetting = data.params as doorSetting;
        DoorAdmin.breakChain("down", params, block, dimension);
        const drop: ItemStack = new ItemStack(`cb2:${params.name}_door_item`, 1);
        dimension.spawnItem(drop, block.center());
    },
    onPlayerInteract({ block, dimension }, data) {
        DoorAdmin.openTheDoor("down", data, block, dimension);
    }
}
const DoorUp: BlockCustomComponent = {
    onBreak({ block, dimension }, data) {
        DoorAdmin.breakChain("up", data.params as doorSetting, block, dimension);
    },
    onPlayerInteract({ block, dimension }, data) {
        DoorAdmin.openTheDoor("up", data, block, dimension);
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:doordown", DoorDown);
    blockComponentRegistry.registerCustomComponent("cb2:doorup", DoorUp);
});