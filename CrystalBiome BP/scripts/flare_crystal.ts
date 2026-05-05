import { BlockCustomComponent, system, Block, Dimension, Vector3 } from "@minecraft/server";

const Flare: BlockCustomComponent = {
    onRandomTick(event) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const loc: Vector3 = block.location;
        const offset: Vector3[] = [
            { "x": 1, "y": 0, "z": 0 },
            { "x": -1, "y": 0, "z": 0 },
            { "x": 0, "y": 1, "z": 0 },
            { "x": 0, "y": -1, "z": 0 },
            { "x": 0, "y": 0, "z": 1 },
            { "x": 0, "y": 0, "z": -1 }
        ];
        let onAir: boolean = false;
        for (let i = 0; i < offset.length; i++) {
            const off: Vector3 = offset[i];
            const near: Block | undefined = dimension.getBlock({ x: loc.x + off.x, y: loc.y + off.y, z: loc.z + off.z });
            if (!near) return;
            if (near.typeId === "minecraft:air") { onAir = true; break; };
        };
        if (onAir) return;
        dimension.playSound("random.fizz", block.center());
        dimension.spawnParticle("cb2:flare_fertile_particle", block.center())
        dimension.setBlockType(loc, "cb2:fertile_crystal_block");
    },
    onPlace(event) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const loc: Vector3 = block.location;
        const above: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z })
        if (above && above.typeId === "cb2:crystal_furnace") {
            dimension.spawnParticle("cb2:powered_flare", block.center())
            block.setPermutation(block.permutation.withState("cb2:powered" as any, true).withState("cb2:fuel" as any, 15));
        }
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:flare_crystal", Flare
    );
});