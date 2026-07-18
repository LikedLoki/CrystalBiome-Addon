import { world, ItemStack, Block, Player, BlockComponentEntityEvent, Entity } from "@minecraft/server";
world.afterEvents.chatSend.subscribe(({ message, sender }) => {
    const a: string[] = message.split(" ");
    if (a[0] === "#") {
        if (!world.getDynamicProperty(a[1])) {
            world.sendMessage("???")
            return;
        }
        world.setDynamicProperty(a[1], a[2] === "undefined" ? undefined : a[2]);
    } else if (a[0] === "$") {
        world.sendMessage(JSON.stringify(world.getDynamicProperty(a[1])));
    }
})

