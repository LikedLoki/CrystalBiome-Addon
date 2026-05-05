import { world, system, WorldBeforeEvents, ItemStack, Player, GameMode, Vector3, ItemEnchantableComponent, Enchantment, Dimension } from "@minecraft/server";

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const item: ItemStack | undefined = event.itemStack;
    if (!item) return;
    const player: Player = event.player;
    const gameMode: GameMode = player.getGameMode();
    if (gameMode === "creative" as string) return;
    const location: Vector3 = event.block.location;
    let { x, y, z }: Vector3 = location;
    x = x + 0.5;
    y = y;
    z = z + 0.5;

    const enchantable: ItemEnchantableComponent | undefined = item.getComponent("minecraft:enchantable");
    if (!enchantable) return;
    const silktouch: Enchantment | undefined = enchantable.getEnchantment("silk_touch");
    if (!silktouch) return
    const dimension: Dimension = event.dimension;
    const blockType: string = event.block.typeId;
    switch (blockType) {
        case "cb2:crystaloak_sapling":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/crystaloaksapling_item"`);
            });
            break;
        case "cb2:crystalcap":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/crystalcap_item"`);
            });
            break;
        case "cb2:crystaloak_leaves_nature":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/block_crystalleaves2"`);
            });
            break;
        case "cb2:blue_crystal_cluster":
        case "cb2:dev_blue_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_blue"`);
            });
            break;
        case "cb2:red_crystal_cluster":
        case "cb2:dev_red_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_red"`);
            });
            break;
        case "cb2:green_crystal_cluster":
        case "cb2:dev_green_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_green"`);
            });
            break;
        case "cb2:yellow_crystal_cluster":
        case "cb2:dev_yellow_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_yellow"`);
            });
            break;
        case "cb2:saline_crystal_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_saline"`);
            });
            break;
        case "cb2:rare_crystal_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_rare"`);
            });
            break;
        case "cb2:flare_crystal_cluster":
            system.run(() => {
                dimension.runCommand(`loot spawn ${x} ${y} ${z} loot "blocks/cluster_item_flare"`);
            });
            break;
    }
});
