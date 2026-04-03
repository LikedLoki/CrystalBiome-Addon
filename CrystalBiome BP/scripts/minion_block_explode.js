import { world, system } from "@minecraft/server";

const candidateBlocks = [];

world.beforeEvents.explosion.subscribe((event) => {
    const impactedBlocks = event.getImpactedBlocks();

    for (const block of impactedBlocks) {
        const type = block.typeId;
        if (type === "cb2:minion_blue_block" || type === "cb2:minion_red_block" || type === "cb2:minion_green_block" || type === "cb2:minion_yellow_block") {
            candidateBlocks.push({
                x: block.location.x,
                y: block.location.y,
                z: block.location.z,
                type: type
            });
        }
    }
});

world.afterEvents.explosion.subscribe((event) => {
    const dimension = event.dimension;

    system.runTimeout(() => {
        for (const b of candidateBlocks) {
            const block = dimension.getBlock({ x: b.x, y: b.y, z: b.z });
            if (block.typeId === "minecraft:air") {
                let newType = "";
                if (b.type === "cb2:minion_blue_block") {
                    newType = "cb2:minion_break_blue_block";
                } else if (b.type === "cb2:minion_red_block") {
                    newType = "cb2:minion_break_red_block";
                } else if (b.type === "cb2:minion_green_block") {
                    newType = "cb2:minion_break_green_block";
                } else if (b.type === "cb2:minion_yellow_block") {
                    newType = "cb2:minion_break_yellow_block";
                }
                if (newType) block.setType(newType);
            }
        }
        candidateBlocks.length = 0;
    }, 2);
});
