import { system, ItemCustomComponent, VectorXZ, Vector3, Vector2, MolangVariableMap, EquipmentSlot, ContainerSlot, world } from "@minecraft/server";
import { PrismInfo } from "./crystal-biome";
import { PrismInfoAdmin } from "./prism-info-fn";

const offsetMap: VectorXZ[] = [
    { x: -1, z: 1 }, { x: 1, z: -1 }, { x: 0, z: 1 }, { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: -1 }, { x: 1, z: 1 }
]

const percent = (value: number, sum: number) => Math.floor((value / sum) * 100) || 0
function kyori(start: VectorXZ | Vector3, end: VectorXZ | Vector3): VectorXZ {
    const kyori: VectorXZ = {
        x: Math.abs(end.x - start.x),
        z: Math.abs(end.z - start.z),
    };
    const sum: number = kyori.x + kyori.z;
    return {
        x: percent(kyori.x, sum),
        z: percent(kyori.z, sum),
    };
};
export const crystalLocate: ItemCustomComponent = {
    onUse({ source }) {
        const { dimension } = source;
        const mainhand: ContainerSlot | undefined = source.getComponent("equippable")?.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand) return;
        dimension.playSound("crystal.break", source.location);
        mainhand.setItem(undefined);
        const prismAdmin = new PrismInfoAdmin(world);
        if (prismAdmin.info.state !== 0) return;
        const locate: Vector3 | undefined = dimension.findClosestBiome(source.location, "cb2:crystal");
        if (!locate) return;
        source.runCommand("camera @s fade time 0.1 4 0.1");
        source.runCommand("inputpermission set @a[r=6] movement disabled");
        source.runCommand("inputpermission set @a[r=6] camera disabled");
        source.runCommand("hud @a[r=6] hide all");
        const { x, y, z } = locate;
        const center: Vector3 = { x: x + 2.5, y: y + 1, z: z + 2.5 };
        prismAdmin.setValue("location", { x: center.x - 0.5, y: center.y, z: center.z - 0.5 });
        prismAdmin.setValue("center", center);
        prismAdmin.setValue("state", 1);
        prismAdmin.apply(world);
        dimension.runCommand(`structure load cbportal_base ${x} ${y} ${z}`)
        const select: VectorXZ = offsetMap[Math.floor(Math.random() * offsetMap.length)];
        system.runTimeout(() => {
            source.runCommand(`tp @a[r=6] ${center.x + select.x} ${center.y} ${center.z + select.z}`);
            source.runCommand("spawnpoint @a[r=6]")
            source.runCommand("inputpermission set @a[r=6] movement enabled");
            source.runCommand("inputpermission set @a[r=6] camera enabled");
            source.runCommand("hud @a[r=6] reset all");
        }, 81)
    }
};