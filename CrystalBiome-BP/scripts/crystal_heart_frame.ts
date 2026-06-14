import { Block, BlockCustomComponent, Container, Dimension, Entity, ItemStack, MolangVariableMap, Player, system, Vector3, VectorXZ } from "@minecraft/server";
import { sleep } from "./other.js";

const binaryMap: VectorXZ[] = [
    { x: 8, z: 0 },
    { x: -8, z: 0 },
    { x: 0, z: 8 },
    { x: 0, z: -8 }
];

const hexParse: Function = (a: number, b: number) => a + b * 16;
const hexStringify: Function = (demical: number) => {
    return {
        a: demical % 16,
        b: Math.floor(demical / 16)
    };
};

export const HeartFrame: BlockCustomComponent = {
    onPlayerInteract({ block, dimension, player }) {
        const vars: MolangVariableMap = new MolangVariableMap();
        vars.setColorRGB("variable.color", { "red": 1, "green": 0.5, "blue": 0.5 });
        if (block.permutation.getState("cb2:frame" as any)) return;
        if (!player) return;
        const container: Container | undefined = player.getComponent("inventory")?.container;
        if (!container) return;
        const item: ItemStack | undefined = container.getItem(player.selectedSlotIndex);
        if (!item || item.typeId !== "cb2:crystal_heart") return;
        const newAmount: number | undefined = item.amount - 1 > 0 ? (() => --item.amount)() : undefined;
        container.setItem(player.selectedSlotIndex, newAmount === undefined ? undefined : item);
        dimension.playSound("block.end_portal_frame.fill", block.location);
        dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), vars);
        block.setPermutation(block.permutation.withState("cb2:frame" as any, 1));
        block.setPermutation(block.permutation.withState("cb2:rot" as any, Math.random() * 4 | 0));
    },
    onTick({ block, dimension }) {
        if (block.permutation.getState("cb2:frame" as any) === 1) {
            const { x, y, z } = block.center();
            const getRot: VectorXZ = binaryMap[block.permutation.getState("cb2:rot" as any)];
            const executorLocation = { x: x + getRot.x, y: y - 1, z: z + getRot.z };
            const getTimer: number = hexParse(block.permutation.getState("cb2:timer_a" as any), block.permutation.getState("cb2:timer_b" as any));
            if (getTimer >= 120) {
                dimension.playSound("item.trident.thunder", executorLocation, { volume: 1, pitch: 0.8 });
                dimension.spawnParticle("cb2:crystal_boss_particle", executorLocation);
                block.setPermutation(block.permutation.withState("cb2:frame" as any, 2));
                const boss: Entity = dimension.spawnEntity(block.permutation.getState("cb2:enemy_type" as any) === 0 ? "cb2:crystal_executor" : "cb2:crystal_wanderment", executorLocation);
                boss.addTag(`cb2:executor_${block.location.x}_${block.location.y}_${block.location.z}`);
                boss.setDynamicProperty("cb2:homeLoc", block.location);
            }
            const vars: MolangVariableMap = new MolangVariableMap();
            if (getTimer % 2 === 0) vars.setColorRGB("variable.color", { "red": 0.8, "green": 1, "blue": 1 });
            else vars.setColorRGB("variable.color", { "red": 0.2, "green": 1, "blue": 1 });
            dimension.spawnParticle("cb2:crystal_particle_disc", executorLocation, vars);
            const newTime: { a: number, b: number } = hexStringify(getTimer + 1);
            block.setPermutation(block.permutation.withState("cb2:timer_a" as any, newTime.a).withState("cb2:timer_b" as any, newTime.b));
        } else if (block.permutation.getState("cb2:frame" as any) === 2) {
            const boss: Entity | undefined = dimension.getEntities({
                type: block.permutation.getState("cb2:enemy_type" as any) === 0 ? "cb2:crystal_executor" : "cb2:crystal_wanderment",
                tags: [`cb2:executor_${block.location.x}_${block.location.y}_${block.location.z}`]
            })[0];
            if (boss) return;
            dimension.setBlockType(block.location, "minecraft:air");
            dimension.spawnItem(new ItemStack(block.permutation.getState("cb2:enemy_type" as any) === 0 ? "cb2:executor_reverberation" : "cb2:wanderment_reverberation"), block.center());
            const players: Player[] | [] = dimension.getPlayers({
                location: block.location,
                maxDistance: 24
            });
            for (const player of players) {
                player.playSound("item.trident.thunder", { volume: 1, pitch: 1.2 });
            }
            dimension.spawnParticle("cb2:orbshard_bigbreak_particle", block.center());
        }
    }
};