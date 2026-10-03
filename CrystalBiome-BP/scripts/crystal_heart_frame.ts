import { Block, BlockCustomComponent, Container, Dimension, Entity, ItemStack, MolangVariableMap, Player, system, VanillaEntityIdentifier, Vector3, VectorXZ } from "@minecraft/server";
import { sleep } from "./other.js";
import { particleColor } from "./crystal-biome.js";

const binaryMap: VectorXZ[] = [
    { x: 8, z: 0 },
    { x: -8, z: 0 },
    { x: 0, z: 8 },
    { x: 0, z: -8 }
];

export const HeartFrame: BlockCustomComponent = {
    onPlayerInteract({ block, dimension, player }) {
        if (!player) return;
        if (block.permutation.getState("cb2:frame" as any) !== 0) return;

        const bossType = block.permutation.getState("cb2:boss_type" as any) as "executor" | "wanderment";
        const boss = dimension.getEntities({
            "closest": 1,
            "type": `cb2:sleep_${bossType}`,
            "maxDistance": 16,
            "location": block.center()
        })[0];
        if (!boss) return;
        console.log("s")

        const { x, z } = block.center();
        const { x: dx, z: dz } = boss.location;
        const directionX = dx - x;
        const directionZ = dz - z;
        let facing: Vector3
        if (Math.abs(directionX) > Math.abs(directionZ)) {
            facing = directionX > 0 ? { x: 9, y: 0, z: 0 } : { x: -9, y: 0, z: 0 }
        } else {
            facing = directionZ > 0 ? { x: 0, y: 0, z: 9 } : { x: 0, y: 0, z: -9 }
        };
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;

        prop.set("cb2:facing", facing);

        // 演出と状態の切り替え
        particleColor.setColorRGB("variable.color", { "red": 1, "green": 0.5, "blue": 0.5 })
        dimension.playSound("block.end_portal_frame.fill", block.location);
        dimension.spawnParticle("cb2:crystal_particle_pop", block.center(), particleColor);
        block.setPermutation(block.permutation.withState("cb2:frame" as any, 1));
    },
    onTick({ block, dimension }) {
        if (block.permutation.getState("cb2:frame" as any) === 2) return;
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;

        const fetchedLoc = prop.get("cb2:facing") as Vector3 | undefined;
        if (!fetchedLoc) return;

        const bossLocation: Vector3 = {
            x: block.location.x + fetchedLoc.x,
            y: block.location.y,
            z: block.location.z + fetchedLoc.z
        }

        const times = +(prop.get("cb2:times") || 0);
        if (times < 120) {
            particleColor.setColorRGB("variable.color", { "red": 0.5, "green": 1, "blue": 1 })
            dimension.spawnParticle("cb2:crystal_particle_disc", bossLocation, particleColor);
            prop.set("cb2:times", times + 1);
        } else {
            const state = block.permutation.getState("cb2:boss_type" as any);

            const boss = dimension.spawnEntity(`cb2:crystal_${state}` as any, bossLocation);
            boss.setDynamicProperty("cb2:homeLoc", block.location);

            dimension.playSound("item.trident.thunder", bossLocation, { volume: 1, pitch: 0.8 });
            dimension.spawnParticle("cb2:crystal_boss_particle", bossLocation);
            block.setPermutation(block.permutation.withState("cb2:frame" as any, 2));
            const sleepBoss = dimension.getEntities({
                "closest": 1,
                "type": `cb2:sleep_${state}`,
                "maxDistance": 16,
                "location": block.center()
            })[0];
            if (!sleepBoss) return;
            sleepBoss.remove();
        }
    }
};