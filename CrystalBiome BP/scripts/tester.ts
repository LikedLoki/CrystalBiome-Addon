import { world, ItemStack, Block, Player } from "@minecraft/server";
world.afterEvents.chatSend.subscribe(({ message, sender }) => {
    const dimension = sender.dimension;
    const loc = sender.location;
    const hmm = dimension.findClosestBiome(loc, "cb2:crystal")
    console.log(hmm?.x,hmm?.y,hmm?.z)
})