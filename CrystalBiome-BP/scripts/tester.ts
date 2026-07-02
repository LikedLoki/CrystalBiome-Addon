import { world, ItemStack, Block, Player, BlockComponentEntityEvent } from "@minecraft/server";
world.afterEvents.chatSend.subscribe(({ message, sender }) => {
    const { x, y, z } = sender.location;
    const get: Block = sender.dimension.getBlock({ x: x, y: y-1, z: z});
    const props = get.getComponent("minecraft:dynamic_properties");
    console.log(props?.get("cb2:box_in_chest"))
})

