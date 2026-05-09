import { Block, BlockComponent, BlockComponentRandomTickEvent, BlockCustomComponent, Dimension, system, Vector3, VectorXZ } from "@minecraft/server";

interface VectorDXZ {
    "dx": number,
    "dz": number
};

const offset: VectorDXZ[] = [
    { "dx": 1, "dz": 0 }, { "dx": -1, "dz": 0 }, { "dx": 0, "dz": 1 }, { "dx": 0, "dz": -1 }
];
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

class GrowthAdmin {
    static canGrowSearch(location: Vector3, dimension: Dimension): Vector3[] {
        const { x, y, z } = location;
        const list: Vector3[] = [];
        for (let dataI = 0, lengI = offset.length; dataI < lengI; dataI++) {
            const { dx, dz } = offset[dataI];
            const sideBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
            if (!sideBlock || sideBlock.typeId !== "minecraft:air" || !allowedBlocks.includes(sideBlock.below()?.typeId ?? "")) continue;
            list.push(sideBlock.location);
        };
        return list;
    };
};

const CapComponent: BlockCustomComponent = {
    onRandomTick({ block, dimension }) {
        const { x, y, z } = block.location;
        if (dimension.getBlock({ x: x, y: y - 1, z: z })?.typeId !== "cb2:fertile_crystal_block") return;
        const canGrowList: Vector3[] = GrowthAdmin.canGrowSearch(block.location, dimension);
        if (canGrowList.length === 0) return;
        const selectLoc: Vector3 = canGrowList[Math.random() * canGrowList.length | 0];
        dimension.setBlockType(selectLoc, "cb2:crystalcap");
    }
}
system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystalcap_grow", CapComponent
    );
});