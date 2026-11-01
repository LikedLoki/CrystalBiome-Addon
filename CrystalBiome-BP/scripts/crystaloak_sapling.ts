import { BlockCustomComponent, BlockVolume, Dimension, Vector3 } from "@minecraft/server";

const treeGeneration = (dimension: Dimension, location: Vector3) => {
    console.log("onPlayerInteract");
    const { x, y, z } = location;
    dimension.runCommand(`structure load crystaloak_tree1 ${x-2} ${y} ${z-2}`);
};

export const CrystalOakSapling: BlockCustomComponent = {
    "onRandomTick"({ block, dimension }) {
        treeGeneration(dimension, block.location);
    },
    "onPlayerInteract"({ block, dimension, player }) {
        if (!player) return;
        
        // プレイヤーが手に持っているアイテムが骨粉でないなら切り返し。
        const container = player.getComponent("minecraft:inventory")?.container;
        const item = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || item.typeId !== "minecraft:bone_meal") return;
        
        // 骨粉が最後の一つなら削除。まだあるなら一個減らす。
        if (item.amount === 1) {
            container?.setItem(player.selectedSlotIndex, undefined);
        } else {
            item.amount--;
            container?.setItem(player.selectedSlotIndex, item);
        }

        // 演出
        dimension.playSound("item.bone_meal.use", block.location, { volume: 1, pitch: 1 });
        dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());

        // 木を生成する。
        treeGeneration(dimension, block.location);
    }
}