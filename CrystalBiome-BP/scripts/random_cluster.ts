import { BlockCustomComponent, GameMode, Player } from "@minecraft/server";
export const RandomCluster: BlockCustomComponent = {
    onTick({ dimension, block }, { params }) {
        const hasPlayer: boolean = dimension.getPlayers({
            "location": block.location,
            "maxDistance": 128,
            "excludeTags": ["cb2:admin"]
        }).length > 0;
        if (!hasPlayer) return;
        const thisFacing: string | undefined = block.permutation.getState("minecraft:block_face");
        if (!thisFacing) return;
        const A: number = Math.random();
        if (A < 0.1) {
            dimension.setBlockType(block.location, `cb2:${params}_crystal_cluster`);
            block.setPermutation(block.permutation.withState("minecraft:block_face", thisFacing));
        } else if (A < 0.9) {
            dimension.setBlockType(block.location, `cb2:${params}_crystal_bud`);
            block.setPermutation(block.permutation.withState("minecraft:block_face", thisFacing));
            block.setPermutation(block.permutation.withState("cb2:growshard" as any, Math.random() * 3 | 0));
        } else dimension.setBlockType(block.location, "minecraft:air");
    }
}