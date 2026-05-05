import { Block, BlockComponent, BlockComponentRandomTickEvent, BlockCustomComponent, Dimension, system, Vector3 } from "@minecraft/server";

const CapComponent: BlockCustomComponent = {
    onRandomTick({ block, dimension }) {
        const { x, y, z }: Vector3 = block.location;
        if (!dimension.getBlock({ x, y: y - 1, z }) || dimension.getBlock({ x, y: y - 1, z })?.typeId !== "cb2:fertile_crystal_block") return;
        const directions: Vector3[] = [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }
        ];
        const isAir: Vector3[] = [];
        directions.forEach((data) => {
            if (dimension.getBlock({ x: x + data.x, y: y + data.y, z: z + data.z })?.typeId === "minecraft:air") isAir.push({ x: x + data.x, y: y + data.y, z: z + data.z });
        });
        if (!isAir.length) return;
        const randomDir: Vector3 = isAir[Math.floor(Math.random() * isAir.length)];
        const targetX: number = randomDir.x;
        const targetY: number = randomDir.y;
        const targetZ: number = randomDir.z;
        const allowedBlocks: string[] = [
            "cb2:crystal_block",
            "cb2:red_crystal_block",
            "cb2:green_crystal_block",
            "cb2:yellow_crystal_block",
            "cb2:saline_crystal_block",
            "cb2:rare_crystal_block",
            "cb2:flare_crystal_block",
            "cb2:clear_crystal_block",
            "cb2:clear_red_crystal_block",
            "cb2:clear_green_crystal_block",
            "cb2:clear_yellow_crystal_block",
            "cb2:fertile_crystal_block"
        ];
        const belowTarget: Block | undefined = dimension.getBlock({ x: targetX, y: targetY - 1, z: targetZ });
        if (!belowTarget || !allowedBlocks.includes(belowTarget.typeId)) return;
        try {
            dimension.runCommand(
                `setblock ${targetX} ${targetY} ${targetZ} cb2:crystalcap`
            );
            dimension.runCommand(
                `particle cb2:crystalparticle_pop ${targetX} ${targetY} ${targetZ}`
            );
        } catch (e) {
            console.warn(`失敗: ${e}`);
        }
    }
};

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystalcap_grow", CapComponent
    );
});