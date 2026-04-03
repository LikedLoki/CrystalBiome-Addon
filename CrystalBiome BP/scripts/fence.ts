import { BlockCustomComponent, Dimension, Block, system, Vector3, BlockPermutation } from "@minecraft/server";

const haitateki: string[] = [
    "minecraft:air",
    "minecraft:snow_layer", "minecraft:fern", "minecraft:large_fern", "minecraft:short_grass",
    "minecraft:tall_grass", "minecraft:short_dry_grass", "minecraft:tall_dry_grass", "minecraft:bush",
    "minecraft:nether_sprouts", "minecraft:deadbush", "minecraft:oak_sapling", "minecraft:birch_sapling",
    "minecraft:spruce_sapling", "minecraft:acacia_sapling", "minecraft:jungle_sapling", "minecraft:dark_oak_sapling",
    "minecraft:mangrove_propagule", "minecraft:cherry_sapling", "minecraft:pale_oak_sapling", "minecraft:glowoak_sapling",
    "minecraft:oak_leaves", "minecraft:birch_leaves", "minecraft:spruce_leaves", "minecraft:acacia_leaves",
    "minecraft:jungle_leaves", "minecraft:dark_oak_leaves", "minecraft:mangrove_leaves", "minecraft:cherry_leaves",
    "minecraft:pale_oak_leaves", "minecraft:glowoak_leaves", "minecraft:wheat", "minecraft:beetroot",
    "minecraft:carrot", "minecraft:potato", "minecraft:pumpkin_stem", "minecraft:melon_stem",
    "minecraft:melon_block", "minecraft:pumpkin", "minecraft:carved_pumpkin", "minecraft:lit_pumpkin",
    "minecraft:torchflower", "minecraft:torchflower_crop", "minecraft:picther", "minecraft:picher_crop",
    "minecraft:ladder", "minecraft:scaffolding", "minecraft:vine", "minecraft:sweet_berry_bush",
    "minecraft:dandelion", "minecraft:poppy", "minecraft:blue_orchid", "minecraft:allium",
    "minecraft:azure_bluet", "minecraft:red_tulip", "minecraft:orange_tulip", "minecraft:Torchflower",
    "minecraft:white_tulip", "minecraft:pink_tulip", "minecraft:oxeye_daisy", "minecraft:cornflower",
    "minecraft:lily_of_the_valley", "minecraft:wither_rose", "minecraft:sunflower", "minecraft:lilac",
    "minecraft:rose_bush", "minecraft:peony", "minecraft:pitcher_plant", "minecraft:cacutas_flower",
    "minecraft:wildflower", "minecraft:pink_petals", "minecraft:crimson_roots", "minecraft:warped_root",
    "minecraft:button", "minecraft:birch_button", "minecraft:spruce_button", "minecraft:acacia_button",
    "minecraft:jungle_button", "minecraft:dark_oak_button", "minecraft:mangrove_button", "minecraft:cherry_button",
    "minecraft:pale_oak_button", "minecraft:crimson_button", "minecraft:warped_button", "minecraft:stone_button",
    "minecraft:blockstone_button", "minecraft:bamboo_button", "minecraft:door", "minecraft:birch_door",
    "minecraft:spruce_door", "minecraft:acacia_door", "minecraft:jungle_door", "minecraft:dark_oak_door",
    "minecraft:mangrove_door", "minecraft:cherry_door", "minecraft:crimson_door", "minecraft:warped_door",
    "minecraft:trapdoor", "minecraft:birch_trapdoor", "minecraft:spruce_trapdoor", "minecraft:acacia_trapdoor",
    "minecraft:jungle_trapdoor", "minecraft:dark_oak_trapdoor", "minecraft:mangrove_trapdoor", "minecraft:cherry_trapdoor",
    "minecraft:crimson_trapdoor", "minecraft:warped_trapdoor", "go2:fence_assist", "minecraft:white_carpet",
    "minecraft:light_gray_carpet", "minecraft:gray_carpet", "minecraft:black_carpet", "minecraft:brown_carpet",
    "minecraft:red_carpet", "minecraft:orange_carpet", "minecraft:yellow_carpet", "minecraft:lime_carpet",
    "minecraft:green_carpet", "minecraft:cyan_carpet", "minecraft:light_blue_carpet", "minecraft:blue_carpet",
    "minecraft:purple_carpet", "minecraft:magenta_carpet", "minecraft:pink_carpet", "minecraft:leaf_litter",
    "minecraft:big_dripleaf", "minecraft:small_dripleaf_block", "minecraft:pointed_dripstone", "minecraft:moss_carpet",
    "minecraft:pale_moss_carpet", "minecraft:resin_clump", "minecraft:weeping_vines", "minecraft:twisting_vines",
    "minecraft:cake", "minecraft:cave_vines", "minecraft:cave_vines_body_with_berries", "minecraft:cave_vines_head_with_berries",
    "minecraft:smooth_stone_slab", "minecraft:normal_stone_slab", "minecraft:cobblestone_slab", "minecraft:mossy_cobblestone_slab",
    "minecraft:oak_slab", "minecraft:spruce_slab", "minecraft:birch_slab", "minecraft:jungle_slab",
    "minecraft:acacia_slab", "minecraft:dark_oak_slab", "minecraft:mangrove_slab", "minecraft:cherry_slab",
    "minecraft:pale_oak_slab", "minecraft:bamboo_slab", "minecraft:bamboo_mosaic_slab", "minecraft:stone_brick_slab",
    "minecraft:mossy_stone_brick_slab", "minecraft:sandstone_slab", "minecraft:cut_sandstone_slab", "minecraft:smooth_sandstone_slab",
    "minecraft:red_sandstone_slab", "minecraft:cut_red_sandstone_slab", "minecraft:smooth_red_sandstone_slab", "minecraft:granite_slab",
    "minecraft:polished_granite_slab", "minecraft:diorite_slab", "minecraft:polished_diorite_slab", "minecraft:andesite_slab",
    "minecraft:polished_andesite_slab", "minecraft:brick_slab", "minecraft:nether_brick_slab", "minecraft:red_nether_brick_slab",
    "minecraft:purpur_slab", "minecraft:end_stone_brick_slab", "minecraft:quartz_slab", "minecraft:smooth_quartz_slab",
    "minecraft:prismarine_slab", "minecraft:dark_prismarine_slab", "minecraft:prismarine_brick_slab", "minecraft:crimson_slab",
    "minecraft:warped_slab", "minecraft:blackstone_slab", "minecraft:polished_blackstone_slab", "minecraft:polished_blackstone_brick_slab",
    "minecraft:cobbled_deepslate_slab", "minecraft:polished_deepslate_slab", "minecraft:deepslate_tile_slab", "minecraft:deepslate_brick_slab",
    "minecraft:tuff_slab", "minecraft:polished_tuff_slab", "minecraft:tuff_brick_slab", "minecraft:mud_brick_slab",
    "minecraft:cut_copper_slab", "minecraft:exposed_cut_copper_slab", "minecraft:weathered_cut_copper_slab", "minecraft:oxidized_cut_copper_slab",
    "minecraft:waxed_cut_copper_slab", "minecraft:waxed_exposed_cut_copper_slab", "minecraft:waxed_weathered_cut_copper_slab", "minecraft:waxed_oxidized_cut_copper_slab",
    "minecraft:resin_brick_slab", "go2:glowoak_slab", "minecraft:powered_comparator", "minecraft:unpowered_comparator",
    "minecraft:cocoa", "minecraft:redstone_wire", "minecraft:powered_repeater", "minecraft:unpowered_repeater",
    "minecraft:copper_door", "minecraft:exposed_copper_door", "minecraft:weathered_copper_door", "minecraft:oxidized_copper_door",
    "minecraft:waxed_copper_door", "minecraft:waxed_exposed_copper_door", "minecraft:waxed_weathered_copper_door", "minecraft:waxed_oxidized_copper_door",
    "minecraft:copper_trapdoor", "minecraft:exposed_copper_trapdoor", "minecraft:weathered_copper_trapdoor", "minecraft:oxidized_copper_trapdoor",
    "minecraft:waxed_copper_trapdoor", "minecraft:waxed_exposed_copper_trapdoor", "minecraft:waxed_weathered_copper_trapdoor", "minecraft:waxed_oxidized_copper_trapdoor",
    "minecraft:anvil", "minecraft:chipped_anvil", "minecraft:damaged_anvil", "minecraft:lava",
    "minecraft:flowing_lava", "minecraft:grindstone", "minecraft:water", "minecraft:flowing_water",
    "minecraft:tripwire_hook", "minecraft:trip_wire", "minecraft:hopper", "minecraft:oak_standing_sign",
    "minecraft:oak_wall_sign", "minecraft:spruce_standing_sign", "minecraft:spruce_wall_sign", "minecraft:birch_standing_sign",
    "minecraft:birch_wall_sign", "minecraft:jungle_standing_sign", "minecraft:jungle_wall_sign", "minecraft:acacia_standing_sign",
    "minecraft:acacia_wall_sign", "minecraft:dark_oak_standing_sign", "minecraft:dark_oak_wall_sign", "minecraft:cherry_standing_sign",
    "minecraft:cherry_wall_sign", "minecraft:mangrove_standing_sign", "minecraft:mangrove_wall_sign", "minecraft:crimson_standing_sign",
    "minecraft:crimson_wall_sign", "minecraft:warped_standing_sign", "minecraft:warped_wall_sign", "minecraft:bamboo_standing_sign",
    "minecraft:bamboo_wall_sign", "minecraft:oak_hanging_sign", "minecraft:spruce_hanging_sign", "minecraft:birch_hanging_sign",
    "minecraft:jungle_hanging_sign", "minecraft:acacia_hanging_sign", "minecraft:dark_oak_hanging_sign", "minecraft:cherry_hanging_sign",
    "minecraft:mangrove_hanging_sign", "minecraft:crimson_hanging_sign", "minecraft:warped_hanging_sign", "minecraft:bamboo_hanging_sign",
    "minecraft:bell", "minecraft:cauldron", "minecraft:brewing_stand", "minecraft:lectern",
    "minecraft:creeper_head", "minecraft:dragon_head", "minecraft:piglin", "minecraft:player_head",
    "minecraft:zombie_head", "minecraft:skeleton_skull", "minecraft:wither_skeleton_skull", "minecraft:standing_banner",
    "minecraft:wall_banner", "minecraft:white_shulker_box", "minecraft:light_gray_shulker_box", "minecraft:gray_shulker_box",
    "minecraft:black_shulker_box", "minecraft:brown_shulker_box", "minecraft:red_shulker_box", "minecraft:orange_shulker_box",
    "minecraft:yellow_shulker_box", "minecraft:lime_shulker_box", "minecraft:green_shulker_box", "minecraft:cyan_shulker_box",
    "minecraft:light_blue_shulker_box", "minecraft:blue_shulker_box", "minecraft:purple_shulker_box", "minecraft:magenta_shulker_box",
    "minecraft:pink_shulker_box", "minecraft:chest", "minecraft:trapped_chest", "minecraft:ender_chest",
    "minecraft:stonevutter_block", "minecraft:conduit", "minecraft:campfire", "minecraft:soul_campfire",
    "minecraft:torch", "minecraft:soul_torch", "minecraft:lantern", "minecraft:soul_lantern",
    "minecraft:bed", "minecraft:redstone_torch", "minecraft:unlit_redstone_torch", "minecraft:lever",
    "minecraft:decorated_pot", "minecraft:flower_pot", "minecraft:oak_pressure_plate",
    "minecraft:spruce_pressure_plate", "minecraft:birch_pressure_plate", "minecraft:jungle_pressure_plate", "minecraft:acacia_pressure_plate",
    "minecraft:dark_oak_pressure_plate", "minecraft:cherry_pressure_plate", "minecraft:mangrove_pressure_plate", "minecraft:crimson_pressure_plate",
    "minecraft:warped_pressure_plate", "minecraft:bamboo_pressure_plate", "minecraft:enchanting_table", "minecraft:sea_pickle",
    "minecraft:stone_pressure_plate", "minecraft:blackstone_pressure_plate", "minecraft:heavy_pressure_plate", "minecraft:light_pressure_plate",
    "minecraft:pale_oak_pressure_plate", "minecraft:pale_oak_standing_sign", "minecraft:pale_oak_wall_sign", "minecraft:firefly_bush",
    "minecraft:lightning_rod", "minecraft:end_rod", "minecraft:end_portal_frame", "minecraft:end_portal",
    "minecraft:daylight_detector", "minecraft:daylight_detector_inverted", "minecraft:chain", "minecraft:sculk_vein",
    "minecraft:glow_lichen", "minecraft:seagrass", "minecraft:pale_hanging_moss", "minecraft:azalea",
    "minecraft:azalea_leaves", "minecraft:azalea_leaves_flowered", "minecraft:flowering_azalea", "minecraft:red_mushroom",
    "minecraft:brown_mushroom", "minecraft:spore_blossom", "cb2:wall_assist", "cb2:blue_crystal_bud",
    "cb2:red_crystal_bud", "cb2:green_crystal_bud", "cb2:yellow_crystal_bud", "cb2:blue_crystal_cluster",
    "cb2:yellow_crystal_cluster", "cb2:red_crystal_cluster", "cb2:green_crystal_cluster", "cb2:blue_crystal_cluster",
    "cb2:crystal_trapdoor", "cb2:red_crystal_trapdoor", "cb2:green_crystal_trapdoor", "cb2:yellow_crystal_trapdoor",
    "cb2:crystaloak_trapdoor", "cb2:crystal_slab", "cb2:red_crystal_slab", "cb2:green_crystal_slab",
    "cb2:yellow_crystal_slab", "cb2:polished_crystal_slab", "cb2:polished_red_crystal_slab", "cb2:polished_green_crystal_slab",
    "cb2:polished_yellow_crystal_slab", "cb2:ground_crystal_slab", "cb2:ground_red_crystal_slab", "cb2:ground_green_crystal_slab",
    "cb2:ground_yellow_crystal_slab", "cb2:crystal_bricks_slab", "cb2:red_crystal_bricks_slab", "cb2:green_crystal_bricks_slab",
    "cb2:yellow_crystal_bricks_slab", "cb2:cracked_crystal_bricks_slab", "cb2:cracked_red_crystal_bricks_slab", "cb2:cracked_green_crystal_bricks_slab",
    "cb2:cracked_yellow_crystal_bricks_slab", "cb2:crystaloak_slab", "cb2:crystal_stairs", "cb2:red_crystal_stairs",
    "cb2:green_crystal_stairs", "cb2:yellow_crystal_stairs", "cb2:polished_crystal_stairs", "cb2:polished_red_crystal_stairs",
    "cb2:polished_green_crystal_stairs", "cb2:polished_yellow_crystal_stairs", "cb2:ground_crystal_stairs", "cb2:ground_red_crystal_stairs",
    "cb2:ground_green_crystal_stairs", "cb2:ground_yellow_crystal_stairs", "cb2:crystal_bricks_stairs", "cb2:red_crystal_bricks_stairs",
    "cb2:green_crystal_bricks_stairs", "cb2:yellow_crystal_bricks_stairs", "cb2:cracked_crystal_bricks_stairs", "cb2:cracked_red_crystal_bricks_stairs",
    "cb2:cracked_green_crystal_bricks_stairs", "cb2:cracked_yellow_crystal_bricks_stairs", "cb2:crystaloak_stairs", "cb2:rare_crystal_cluster",
    "cb2:rare_crystal_bud", "cb2:flare_crystal_cluster", "cb2:flare_crystal_bud", "cb2:blue_crystal_statue",
    "cb2:red_crystal_statue", "cb2:green_crystal_statue", "cb2:yellow_crystal_statue", "cb2:rare_crystal_slab",
    "cb2:rare_crystal_slab", "cb2:polished_rare_crystal_slab", "cb2:rare_crystal_bricks_slab", "cb2:ground_rare_crystal_slab",
    "cb2:rare_crystal_stairs", "cb2:polished_rare_crystal_stairs", "cb2:rare_crystal_bricks_stairs", "cb2:ground_rare_crystal_stairs",
    "cb2:wall_assist", "cb2:fence_assist"
];

const Fence: BlockCustomComponent = {
    onPlace(event) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        updateFence(block, dimension);
        const loc: Vector3 = block.location;
        const checkset: Vector3[] = [
            { "x": 0, "y": 0, "z": -1 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": -1, "z": 0 }, { "x": 0, "y": 1, "z": 0 }
        ];
        for (const deta of checkset) {
            const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y + deta.y, z: loc.z + deta.z });
            if (!getblock) continue;
            const hasTag: boolean = getblock.permutation.hasTag("cb2:is_fence");
            if (!hasTag) continue;
            const newloc: Vector3 = getblock.location
            updateFence(getblock, dimension);
            const above: Block | undefined = dimension.getBlock({ x: newloc.x, y: newloc.y + 1, z: newloc.z });
            if (!above) continue;
            if (above.typeId === "cb2:fence_assist") updateAssist(above, dimension);
        };
        let above: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
        if (!above) return;
        if (above.typeId === "minecraft:air") dimension.setBlockType({ x: loc.x, y: loc.y + 1, z: loc.z }, "cb2:fence_assist");
        above = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
        updateAssist(above, dimension);

    },
    onBreak(event) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const loc: Vector3 = block.location;
        const ue: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
        if (!ue) return;
        if (ue.typeId === "cb2:fence_assist") {
            dimension.setBlockType({ x: loc.x, y: loc.y + 1, z: loc.z }, "minecraft:air");
        }
        const checkset: Vector3[] = [
            { "x": 0, "y": 0, "z": -1 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": -1, "z": 0 }, { "x": 0, "y": 1, "z": 0 }
        ];
        for (const deta of checkset) {
            const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y + deta.y, z: loc.z + deta.z });
            if (!getblock) return;
            const hasTag = getblock.permutation.hasTag("cb2:is_fence");
            if (!hasTag) return;
            const newloc: Vector3 = getblock.location;
            updateFence(getblock, dimension);
            const above: Block | undefined = dimension.getBlock({ x: newloc.x, y: newloc.y + 1, z: newloc.z });
            if (!above) return;
            if (above.typeId === "cb2:fence_assist") updateAssist(above, dimension);

        }
    }
};
export function updateFence(block: Block, dimension: Dimension) {
    const loc: Vector3 = block.location;
    const offset: { name: string, x: number, z: number }[] = [
        { "name": "east", "x": 1, "z": 0 },
        { "name": "west", "x": -1, "z": 0 },
        { "name": "south", "x": 0, "z": 1 },
        { "name": "north", "x": 0, "z": -1 }
    ];
    let CE: boolean, CW: boolean, CS: boolean, CN: boolean;
    CE = CW = CS = CN = false;
    for (const data of offset) {
        const side: Block | undefined = dimension.getBlock({ x: loc.x + data.x, y: loc.y, z: loc.z + data.z });
        if (!side) continue;
        const isHaita: boolean = haitateki.includes(side?.typeId);
        const connected: boolean = !isHaita;
        if (data.name === "east") CE = connected;
        if (data.name === "west") CW = connected;
        if (data.name === "south") CS = connected;
        if (data.name === "north") CN = connected;
        console.log(data.name, side.typeId, Math.floor(Math.random() * 10))
    };
    const curperm: BlockPermutation = block.permutation;
    const newperm: BlockPermutation = curperm
        .withState("cb2:connect_east" as any, CE)
        .withState("cb2:connect_west" as any, CW)
        .withState("cb2:connect_south" as any, CS)
        .withState("cb2:connect_north" as any, CN)
    if (!curperm.matches(newperm.type.id, newperm.getAllStates())) {
        block.setPermutation(newperm);
        const checkset: Vector3[] = [
            { "x": 0, "y": 0, "z": -1 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": -1, "z": 0 }, { "x": 0, "y": 1, "z": 0 }
        ];
        for (const deta of checkset) {
            const getblock: Block | undefined = dimension.getBlock({ x: loc.x + deta.x, y: loc.y + deta.y, z: loc.z + deta.z });
            if (!getblock) continue;
            const hasTag: boolean = getblock.permutation.hasTag("cb2:is_fence");
            if (!hasTag) continue;
            const newloc: Vector3 = getblock.location;
            updateFence(getblock, dimension);
            const above: Block | undefined = dimension.getBlock({ x: newloc.x, y: newloc.y + 1, z: newloc.z });
            if (!above) continue;
            if (above.typeId === "cb2:fence_assist") updateAssist(above, dimension);
        }
    };
};
export function updateAssist(block: Block | undefined, dimension: Dimension) {
    if (!block) return;
    const loc: Vector3 = block.location;
    const below: Block | undefined = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
    if (!below) return;
    const CE: boolean = below.permutation.getState("cb2:connect_east" as any);
    const CW: boolean = below.permutation.getState("cb2:connect_west" as any);
    const CS: boolean = below.permutation.getState("cb2:connect_south" as any);
    const CN: boolean = below.permutation.getState("cb2:connect_north" as any);
    const newperm: BlockPermutation = block.permutation
        .withState("cb2:connect_east" as any, CE)
        .withState("cb2:connect_west" as any, CW)
        .withState("cb2:connect_south" as any, CS)
        .withState("cb2:connect_north" as any, CN);
    block.setPermutation(newperm);
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:fence", Fence);
});