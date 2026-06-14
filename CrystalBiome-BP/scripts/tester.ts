import { world, ItemStack, Block, Player } from "@minecraft/server";
import { packingBoxList } from "./packing_box";
world.afterEvents.chatSend.subscribe(({ message, sender }) => {
    console.log(world.getDynamicProperty("cb2:packing_list"));
    console.log(JSON.stringify(packingBoxList));
    console.log(world.getDynamicProperty("cb2:furnace_list"));
})