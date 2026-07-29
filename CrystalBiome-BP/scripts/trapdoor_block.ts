import { BlockComponentPlayerInteractEvent, Block, system, Dimension, Vector3 } from "@minecraft/server";

export const TrapdoorBlock: any = {
    onPlayerInteract(event: BlockComponentPlayerInteractEvent, data: { params: { open: string, close: string } }) {
        const block: Block = event.block;
        const dimension: Dimension = block.dimension;
        const { params } = data;
        const current: boolean = block.permutation.getState("cb2:open" as any);
        const newVal: boolean = !current;
        block.setPermutation(block.permutation.withState("cb2:open" as any, newVal));
        const pos: Vector3 = block.location;
        const openSound: string = params.open ?? "open_trapdoor.copper"
        if (newVal) {
            dimension.playSound(openSound, pos, { volume: 1, pitch: 1 });
        } else {
            dimension.playSound(openSound, pos, { volume: 1, pitch: 1 });
        }
    }
};