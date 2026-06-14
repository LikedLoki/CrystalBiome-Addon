import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent, VectorXZ, CustomComponentParameters } from "@minecraft/server";

interface doorSetting {
    name: string,
    open: string,
    close: string;
};
type FourRot = "east" | "west" | "south" | "north";
type VerticalType = "up" | "down";

class DoorAdmin {
    #sideBlock: Block;
    #facing: FourRot;
    constructor(sideBlock: Block, facing: FourRot) {
        this.#facing = facing;
        this.#sideBlock = sideBlock;
    }
    static newCreate(block: Block, dimension: Dimension): DoorAdmin | undefined {
        const { x, y, z } = block.location;
        const facing: string | undefined = block.permutation.getState("minecraft:cardinal_direction");
        if (!facing || facing !== "east" && facing !== "west" && facing !== "south" && facing !== "north") return undefined;
        const sideBlock: Block | undefined = dimension.getBlock({ x: x + offset[facing].x, y: y, z: z + offset[facing].z });
        if (!sideBlock) return undefined;
        return new DoorAdmin(sideBlock, facing as FourRot);
    }
    static getId(name: string, type: VerticalType): string {
        return `cb2:${name}_door_${type}`;
    }
    static breakChain(type: VerticalType, params: doorSetting, block: Block, dimension: Dimension) {
        const { x, y, z } = block.location;
        const targetBlock: Block | undefined = type === "down" ? block.above() : block.below();
        if (!targetBlock || targetBlock.typeId !== this.getId(params.name, type === "up" ? "down" : "up")) return;
        dimension.setBlockType({ x: x, y: y + (type === "down" ? 1 : -1), z: z }, "minecraft:air");
    }
    static openTheDoor(type: VerticalType, data: CustomComponentParameters, block: Block, dimension: Dimension) {
        const params: doorSetting = data.params as doorSetting;
        const targetBlock: Block | undefined = type === "down" ? block.above() : block.below();
        const newPerm: number = block.permutation.getState("cb2:open" as any) ? 0 : 1;
        block.setPermutation(block.permutation.withState("cb2:open" as any, newPerm));
        if (targetBlock) targetBlock.setPermutation(targetBlock.permutation.withState("cb2:open" as any, newPerm));
        const openSound: string = params.open ?? "open_door.copper"
        const closeSound: string = params.close ?? "close_door.copper"
        dimension.playSound(newPerm === 1 ? openSound : closeSound, block.location, { volume: 1, pitch: 1 });
    }
    get sideBlock() {
        return this.#sideBlock;
    }
    get selfFacing() {
        return this.#facing;
    }
}

const offset: Record<string, VectorXZ> = {
    "east": { x: 0, z: -1 },
    "west": { x: 0, z: 1 },
    "south": { x: 1, z: 0 },
    "north": { x: -1, z: 0 }
}
export const DoorDown: BlockCustomComponent = {
    onPlace({ block, dimension }, data) {
        const upperBlock: Block | undefined = block.above();
        if (!upperBlock || !upperBlock.isAir) {
            dimension.setBlockType(block.location, "minecraft:air");
            return;
        };
        const { x, y, z } = block.location;
        const params: doorSetting = data.params as doorSetting;
        dimension.setBlockType({ x: x, y: y + 1, z: z }, DoorAdmin.getId(params.name, "up"));
        const doorAdmin: DoorAdmin | undefined = DoorAdmin.newCreate(block, dimension);
        if (!doorAdmin) return;
        upperBlock.setPermutation(
            upperBlock.permutation.withState("minecraft:cardinal_direction", doorAdmin.selfFacing)
        );
        if (doorAdmin.sideBlock.typeId !== DoorAdmin.getId(params.name, "down")) return;
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
};
export const DoorUp: BlockCustomComponent = {
    onBreak({ block, dimension }, data) {
        DoorAdmin.breakChain("up", data.params as doorSetting, block, dimension);
    },
    onPlayerInteract({ block, dimension }, data) {
        DoorAdmin.openTheDoor("up", data, block, dimension);
    }
};