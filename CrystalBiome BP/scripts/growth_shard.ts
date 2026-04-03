import { system, BlockPermutation, Vector3, BlockCustomComponent, Block, Dimension } from "@minecraft/server";
const belowMap: { [rot: string]: Vector3 } = {
    "east": { "x": -1, "y": 0, "z": 0 },
    "west": { "x": 1, "y": 0, "z": 0 },
    "south": { "x": 0, "y": 0, "z": -1 },
    "north": { "x": 0, "y": 0, "z": 1 },
    "up": { "x": 0, "y": -1, "z": 0 },
    "down": { "x": 0, "y": 1, "z": 0 }
};
const CrystalShardGrow: BlockCustomComponent = {
    onRandomTick({ block, dimension }, data) {
        const params = data.params as { name: string, chance: number }
        if (Math.random() > params.chance) return;
        const loc: Vector3 = block.location;
        const facing: string | undefined = block.permutation.getState("minecraft:block_face");
        if (!facing) return;
        const below: Block | undefined = dimension.getBlock({ x: loc.x + belowMap[facing].x, y: loc.y + belowMap[facing].y, z: loc.z + belowMap[facing].z });
        if (!below || below.typeId !== "cb2:fertile_crystal_block") return;
        const nowGrow: number = block.permutation.getState("cb2:growshard" as any);
        if (nowGrow < 2) {
            block.setPermutation(
                block.permutation.withState("cb2:growshard" as any, nowGrow + 1)
            );
        } else if (nowGrow === 2) {
            const permutation = BlockPermutation.resolve(`cb2:${params.name}_cluster`, {
                "minecraft:block_face": facing
            });
            const getblock: Block | undefined = dimension.getBlock(loc);
            if (!getblock) return;
            getblock.setPermutation(permutation);
        };
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:shardgrowth",
        CrystalShardGrow
    );
});
