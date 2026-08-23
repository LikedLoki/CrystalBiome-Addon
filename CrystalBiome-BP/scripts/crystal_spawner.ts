import { Block, BlockCustomComponent, Entity, GameMode, MolangVariableMap, Player, system, Vector3, VectorXZ } from "@minecraft/server";
import { getBlocks } from "./other";
import { crystalSpawnFn, SettingColor } from "./crystal-spawn-fn"

const offsetMap: VectorXZ[] = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }, { x: 1, z: 1 }, { x: -1, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }
];

export const Spawner: BlockCustomComponent = {
    onPlace({ block, dimension }) {
        const { x, y, z } = block.center();
        block.setPermutation(block.permutation.withState("cb2:count" as any, 6));
        dimension.spawnEntity("cb2:cbspawner_block" as any, { x: x, y: y - 0.5, z: z });
    },
    onBreak({ block, dimension }) {
        const { x, y, z } = block.location;
        const summonedEntity: Entity[] | [] = dimension.getEntities({
            "location": block.center(),
            "tags": [`cb2:spawner_${x}=${y}=${z}`]
        });
        for (let I = 0, lenI = summonedEntity.length; I < lenI; I++) {
            summonedEntity[I].remove();
        };
        dimension.spawnParticle("cb2:orbshard_break_particle", block.center());
        dimension.playSound("crystal.break", block.center(), { pitch: 0.8 });
    },
    onTick({ block, dimension }) {
        const activeState: number = block.permutation.getState("cb2:active" as any);
        if (activeState === 2) return;
        if (activeState === 0) {
            const { x, y, z } = block.center()
            const hasPlayer: boolean = dimension.getPlayers({
                "location": {
                    "x": x - 4,
                    "y": y - 2,
                    "z": z - 4
                },
                "volume": {
                    "x": 8,
                    "y": 4,
                    "z": 8
                },
                "gameMode": GameMode.Survival
            })[0] ? true : false;
            if (!hasPlayer) return;
            const vars: MolangVariableMap = new MolangVariableMap();
            vars.setColorRGB("variable.color", { red: 1, green: 0.6, blue: 0.6 })
            dimension.playSound("cbspawner_detect", block.location, { pitch: 1.5 })
            dimension.spawnParticle("cb2:cbspawner_react_particle", block.center(), vars);
            block.setPermutation(block.permutation.withState("cb2:active" as any, 1));
        } else if (activeState === 1) {
            const { x, y, z } = block.location;
            const spawnCount: number = block.permutation.getState("cb2:count" as any);
            const guardAmount: number = dimension.getEntities({
                "location": block.center(),
                "tags": [`cb2:spawner_${x}=${y}=${z}`]
            }).length;
            if (spawnCount <= 0 && guardAmount > 0) return;
            else if (spawnCount <= 0 && guardAmount <= 0) {
                const { x, y, z } = block.location;
                dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
                dimension.spawnParticle("cb2:orbshard_break_particle", block.center());
                dimension.playSound("crystal.break", block.center(), { pitch: 0.8 });
                return;
            }
            if (guardAmount >= 3) return;
            const lowerBlocks: Block[] | [] = getBlocks(offsetMap, 0, block.location, dimension);
            const upperBlocks: Block[] | [] | undefined = lowerBlocks.length === 0 ? getBlocks(offsetMap, -1, block.location, dimension) : undefined;
            if (lowerBlocks.length === 0 && (upperBlocks?.length === 0 || !upperBlocks)) return;
            const layerBlocks: Block[] | undefined = lowerBlocks.length === 0 ? upperBlocks : lowerBlocks;
            if (!layerBlocks) return;
            const selectVector: Vector3 = layerBlocks[Math.floor(Math.random() * layerBlocks.length)].center();
            const selectEntity: string = ["cb2:crystal_guard", "cb2:crystal_wander"][Math.floor(Math.random() * 2)];
            const selectColor = ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)] as SettingColor;
            crystalSpawnFn(dimension, selectEntity, selectVector, selectColor).addTag(`cb2:spawner_${x}=${y}=${z}`);
            block.setPermutation(block.permutation.withState("cb2:count" as any, block.permutation.getState("cb2:count" as any) - 1));
        }
    }
}