import { EquipmentSlot, GameMode, world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
function growSapling(block) {
    const dimension = block.dimension; // dimension取得
    const center = block.center();

    const offsetX = -2;
    const offsetY = 0;
    const offsetZ = -2;

    const loadX = Math.floor(center.x + offsetX);
    const loadY = Math.floor(center.y + offsetY);
    const loadZ = Math.floor(center.z + offsetZ);

    const structures = [
        "crystaloak_tree1"
    ];

    const randomStructure = structures[Math.floor(Math.random() * structures.length)];

    try {
        dimension.runCommand(`structure load ${randomStructure} ${loadX} ${loadY} ${loadZ}`);
    } catch (e) {
        console.warn(`構造物ロードに失敗: ${e}`);
    }
}

const SaplingComponent = {
    onRandomTick({ block }) {
        if (Math.random() < 0.1) {
            growSapling(block);
        }
    },

    onPlayerInteract({ player, block, dimension }) {
        if (!player) return;

        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) return;

        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand.hasItem() || mainhand.typeId !== "minecraft:bone_meal") return;

        if (player.getGameMode() === GameMode.Creative) {
            growSapling(block);
        } else {
            if (Math.random() < 0.5) {
                growSapling(block);
            }
            if (mainhand.amount > 1) mainhand.amount--;
            else mainhand.setItem(undefined);
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
            dimension.playSound("item.bone_meal.use", block.center());
        }
    }

};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:sapling_grow",
        SaplingComponent
    );
});