import { system, MolangVariableMap, BlockComponentStepOnEvent,Block, Dimension, Vector3, BlockCustomComponent, BlockComponentOnPlaceEvent, VanillaEntityIdentifier } from "@minecraft/server";

export const Placespawn: BlockCustomComponent = {
   onPlace({ block, dimension }, { params }) {
    const { x, y, z } = block.location;
    for (const set of params as string) dimension.spawnEntity(set as VanillaEntityIdentifier, { x: x + 0.5, y: y + 0.2, z: z + 0.5 });
   }
};