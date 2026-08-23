import { BlockCustomComponent, BlockVolume, BlockVolumeBase, system, TimeOfDay, Vector3, world } from "@minecraft/server"
import { PrismInfoAdmin } from "./prism-info-fn";
import { sleep } from "./other";
import { CrystHrznAdmin, CrystlHrznGenerator } from "./crystal_horizon";

const offsetList = [
    { x: -1, z: 1 }, { x: 1, z: -1 }, { x: 0, z: 1 }, { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: -1 }, { x: 1, z: 1 }
] as const;

const thirdItemMap = {
    "cb2:executor_reverberation": "king",
    "cb2:wanderment_reverberation": "miracle",
    "cb2:shine_reverberation": "king&miracle"
} as const;


export const Portal: Record<string, BlockCustomComponent> = {
    "first_second": {
        onPlayerInteract({ dimension, player, block }) {
            if (!player) return;
            // プロパティを取得し、存在しないなら切り返し。
            const prop = block.getComponent("minecraft:dynamic_properties");
            if (!prop) return;

            // ステートを取得し、不正なら切り返し。
            const state = block.permutation.getState("cb2:portal" as any) as unknown;
            if (state !== "close" && state !== "first_in" && state !== "in" && state !== "out") return;

            // このブロックはfirstかsecondか
            const isFirstPortal: boolean = block.typeId.split("_")[1] === "first"

            console.log(state)

            // ブロックがsecondで、未起動なら起動を試みる。無理なら切り返し。
            if (!isFirstPortal && state === "close") {
                const container = player.getComponent("minecraft:inventory")?.container;
                const item = container?.getItem(player.selectedSlotIndex);
                if (!container || item?.typeId !== "cb2:crystal_heart") return;

                block.setPermutation(block.permutation.withState("cb2:portal" as any, "first_in"))
                const nextItem = item.amount - 1 === 0 ? undefined : (() => { item.amount--; return item })();
                container.setItem(player.selectedSlotIndex, nextItem);
            }

            // 入り口側のポータルなら
            if (state === "first_in") {
                block.setPermutation(block.permutation.withState("cb2:portal" as any, "in"))
                // バイオームを探して座標を取得する。なければ切り返し。
                const selectedBiome = isFirstPortal ? (Math.random() < 0.5 ? "cb2:crystal" : "cb2:crystal_forest") : "cb2:desolate_crystal";
                const outLocation = dimension.calculateClosestBiomeFromSeed(block.location, selectedBiome);
                if (!outLocation) return;


                const { x, y, z } = outLocation;
                const center: Vector3 = { x: x + 2.5, y: y + 1, z: z + 2.5 };

                const selectedOffset = offsetList[Math.floor(Math.random() * offsetList.length)];
                const spawnLocation: Vector3 = { x: center.x + selectedOffset.x, y: center.y, z: center.z + selectedOffset.z }

                // 生成
                if (isFirstPortal) dimension.runCommand(`structure load cbportal_base ${x} ${y} ${z}`);
                else dimension.runCommand(`structure load cbportal_base_d ${x} ${y} ${z}`);

                // プリズムストーンの情報を更新
                const prismAdmin = new PrismInfoAdmin(world)
                prismAdmin.setValue("state", 1);
                prismAdmin.apply(world);

                // 演出
                dimension.playSound("crystal.break", player.location);
                player.runCommand("camera @s fade time 0.1 4 0.1");
                player.runCommand("inputpermission set @a[r=6] movement disabled");
                player.runCommand("inputpermission set @a[r=6] camera disabled");
                player.runCommand("hud @a[r=6] hide all");
                system.runTimeout(() => {
                    prop.set("cb2:out", spawnLocation);
                    player.runCommand(`tp @a[r=6] ${spawnLocation.x} ${spawnLocation.y} ${spawnLocation.z}`);
                    player.runCommand("spawnpoint @a[r=6]")
                    player.runCommand("inputpermission set @a[r=6] movement enabled");
                    player.runCommand("inputpermission set @a[r=6] camera enabled");
                    player.runCommand("hud @a[r=6] reset all");

                    const outPortalLoc: Vector3 = { x: center.x, y: center.y + 1, z: center.z }
                    const setBlock = async () => {
                        await sleep(20)
                        try {
                            dimension.setBlockType(outPortalLoc, `cb2:crystal_${isFirstPortal ? "first" : "second"}_portal`);
                        } catch (_) {
                            setBlock()
                        }
                        const outPortal = dimension.getBlock(outPortalLoc)
                        if (!outPortal) return;
                        outPortal.setPermutation(outPortal.permutation.withState("cb2:portal" as any, "out"))
                        outPortal.getComponent("minecraft:dynamic_properties")?.set("cb2:in", block.location);
                    }
                    setBlock();
                }, 81)
            } else if (state === "in") {
                const outLocation = prop.get("cb2:out") as Vector3 | undefined;
                if (!outLocation) return;
                player.teleport(outLocation);
                dimension.playSound("mob.endermen.portal", player.location);
            } else {
                const outLocation = prop.get("cb2:in") as Vector3 | undefined;
                if (!outLocation) return;
                player.teleport(outLocation);
                dimension.playSound("mob.endermen.portal", player.location);
            }
        }
    },
    third: {
        onPlayerInteract({ dimension, player, block }) {
            if (!player) return;
            // プロパティを取得し、存在しないなら切り返し。
            const prop = block.getComponent("minecraft:dynamic_properties");
            if (!prop) return;

            // ステートを取得し、不正なら切り返し。
            const state = block.permutation.getState("cb2:portal" as any) as unknown;
            if (state !== "close" && state !== "first_in" && state !== "in" && state !== "out" && state !== "mayout") return;
            
            if (state === "close") {
                const container = player.getComponent("minecraft:inventory")?.container;
                const item = container?.getItem(player.selectedSlotIndex);
                if (!container || item?.typeId !== "cb2:executor_reverberation" && item?.typeId !== "cb2:wanderment_reverberation" && item?.typeId !== "cb2:shine_reverberation") return;

                world.setDynamicProperty("cb2:ch_boss_type", thirdItemMap[item.typeId]);
                block.setPermutation(block.permutation.withState("cb2:portal" as any, "first_in"))
                const nextItem = item.amount - 1 === 0 ? undefined : (() => { item.amount--; return item })();
                container.setItem(player.selectedSlotIndex, nextItem);
            }

            const crystalHorizon = world.getDimension("cb2:crystal_horizon");
            const overworld = world.getDimension("minecraft:overworld")
            if (state === "first_in") {
                block.setPermutation(block.permutation.withState("cb2:portal" as any, "in"))
                // 演出
                dimension.playSound("crystal.break", player.location);
                player.runCommand("camera @s fade time 0.1 4 0.1");
                player.runCommand("inputpermission set @a[r=6] movement disabled");
                player.runCommand("inputpermission set @a[r=6] camera disabled");
                player.runCommand("hud @a[r=6] hide all");

                world.tickingAreaManager.createTickingArea(`cb2:a`, {
                dimension: crystalHorizon,
                from: { x: 16, y: 16, z: 16 },
                to: { x: -16, y: -16, z: -16 }
            })
            const location: Vector3 = { x: 0, y: 0, z: 0 };
            const { x, y, z } = location;
                system.runTimeout(() => {
                    world.setTimeOfDay(TimeOfDay.Day)
                    prop.set("cb2:out", location);
                    player.teleport(location, { dimension: crystalHorizon });
                    player.runCommand("inputpermission set @a[r=6] movement enabled");
                    player.runCommand("inputpermission set @a[r=6] camera enabled");
                    player.runCommand("hud @a[r=6] reset all");
                    player.fogSettings.push("cb2:crystal_horizon_air", "cb2:cha");

                    
                    CrystHrznAdmin(crystalHorizon, 16);
                    crystalHorizon.runCommand(`structure load third_portal_base ${x-2} ${y-1} ${z-2}`);

                    const outPortalLoc: Vector3 = { x: x, y: y+2, z: z };
                    crystalHorizon.setBlockType(outPortalLoc, "cb2:crystal_third_portal");
                    const outPortal = crystalHorizon.getBlock(outPortalLoc)
                    if (!outPortal) return;
                    outPortal.setPermutation(outPortal.permutation.withState("cb2:portal" as any, "mayout"))
                    outPortal.getComponent("minecraft:dynamic_properties")?.set("cb2:in", block.location);
                    world.tickingAreaManager.removeTickingArea("cb2:a")
                }, 81)
            } else if (state === "mayout") {
                world.setDynamicProperty("cb2:ch_stop", true);
            } else if (state === "in") {
                player.fogSettings.push("cb2:crystal_horizon_air", "cb2:cha");
                dimension.playSound("mob.endermen.portal", player.location);
                const outLocation = prop.get("cb2:out") as Vector3 | undefined;
                if (!outLocation) return;
                player.teleport(outLocation, { dimension: crystalHorizon });
            } else {
                player.fogSettings.remove("cb2:cha");
                dimension.playSound("mob.endermen.portal", player.location);
                const outLocation = prop.get("cb2:in") as Vector3 | undefined;
                if (!outLocation) return;
                player.teleport(outLocation, { dimension: overworld });
            }
        }
    }
}