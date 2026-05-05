import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent } from "@minecraft/server";
import { DropdownOptions } from "@minecraft/server-ui";

interface doorSetting {
    name:string,
    open:string,
    close:string;
}
const DoorDown: BlockCustomComponent = {
    onPlace(event, data) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const params = data.params as doorSetting;
        if (!params) return;
        const above: Vector3 = {
            x: Math.floor(block.location.x),
            y: Math.floor(block.location.y) + 1,
            z: Math.floor(block.location.z)
        };
        const upper: Block | undefined = dimension.getBlock(above);
        if (!upper) return;
        if (upper.typeId !== "minecraft:air") {
            dimension.setBlockType(block.location, "minecraft:air");
            return;
        };
        const facing: string | undefined = block.permutation.getState("minecraft:cardinal_direction");
        let roffset: { x: number, z: number } = { x: 0, z: 0 }
        switch (facing) {
            case "east": roffset = { x: 0, z: -1 }; break;
            case "west": roffset = { x: 0, z: 1 }; break;
            case "south": roffset = { x: 1, z: 0 }; break;
            case "north": roffset = { x: -1, z: 0 }; break;
        }
        dimension.setBlockType(above, `cb2:${params.name}_door_up`);
        upper.setPermutation(
            upper.permutation.withState("minecraft:cardinal_direction", facing)
        );
        const side: Block | undefined = dimension.getBlock({ x: block.location.x + roffset.x, y: block.location.y, z: block.location.z + roffset.z });
        if (!side) return;
        if (side.typeId === `cb2:${params.name}_door_down`) {
            block.setPermutation(
                block.permutation.withState("cb2:revers" as any, 1)
            );
            upper.setPermutation(
                upper.permutation.withState("cb2:revers" as any, 1)
            );
        }
    },
    onBreak(event, data) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const params = data.params as doorSetting;
        const above: Vector3 = {
            x: Math.floor(block.location.x),
            y: Math.floor(block.location.y) + 1,
            z: Math.floor(block.location.z)
        };
        const upper: Block | undefined = dimension.getBlock(above);
        if (!upper) return;
        if (upper.typeId === `cb2:${params.name}_door_up`) dimension.setBlockType(above, "minecraft:air");
        const drop: ItemStack = new ItemStack(`cb2:${params.name}_door_item`, 1);
        dimension.spawnItem(drop, block.center());
    },
    onPlayerInteract(event, data) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const params = data.params as doorSetting;
        const above: Vector3 = {
            x: Math.floor(block.location.x),
            y: Math.floor(block.location.y) + 1,
            z: Math.floor(block.location.z)
        };
        const upper: Block | undefined = dimension.getBlock(above);
        if (!upper) return;
        const newperm: number = block.permutation.getState("cb2:open" as any);
        const newval = newperm === 1 ? 0 : 1;
        block.setPermutation(
            block.permutation.withState("cb2:open" as any, newval)
        );
        upper.setPermutation(
            upper.permutation.withState("cb2:open" as any, newval)
        );
        const openSound: string = params.open ?? "open_door.copper"
        const closeSound: string = params.close ?? "close_door.copper"
        dimension.playSound(newval === 1 ? openSound : closeSound, block.location, { volume: 1, pitch: 1 });
    }
}
const DoorUp: BlockCustomComponent = {
    onBreak(event, data) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const params = data.params as doorSetting;
        const below: Vector3 = {
            x: Math.floor(block.location.x),
            y: Math.floor(block.location.y) - 1,
            z: Math.floor(block.location.z)
        };
        const down: Block | undefined = dimension.getBlock(below);
        if (!down) return;
        if (down.typeId === `cb2:${params.name}_door_down`) dimension.setBlockType(below, "minecraft:air");
    },
    onPlayerInteract(event, data) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const params = data.params as doorSetting;
        const below: Vector3 = {
            x: Math.floor(block.location.x),
            y: Math.floor(block.location.y) - 1,
            z: Math.floor(block.location.z)
        };
        const down: Block | undefined = dimension.getBlock(below);
        if (!down) return;
        const newperm: number = block.permutation.getState("cb2:open" as any);
        const newval: number = newperm === 1 ? 0 : 1;
        block.setPermutation(
            block.permutation.withState("cb2:open" as any, newval)
        );
        down.setPermutation(
            down.permutation.withState("cb2:open" as any, newval)
        );
        const openSound: string = params.open ?? "open_door.copper"
        const closeSound: string = params.close ?? "close_door.copper"
        dimension.playSound(newval === 1 ? openSound : closeSound, block.location, { volume: 1, pitch: 1 });
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:doordown", DoorDown);
    blockComponentRegistry.registerCustomComponent("cb2:doorup", DoorUp);
});