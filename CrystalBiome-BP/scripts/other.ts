import { world, system, Entity, Dimension, MolangVariableMap, VanillaEntityIdentifier, Vector3, VectorXZ, Block } from "@minecraft/server";
export const sleep = (tick: number) => new Promise<void>(resolve => system.runTimeout(() => {resolve()}, tick));

export type ColorRGB = {
    red: number,
    green: number,
    blue: number
};

export function getBlocks(offsetXZ: VectorXZ[], offsetY: number, loc: Vector3, dimension: Dimension): Block[] | [] {
    const result: Block[] = [];
    offsetXZ.forEach(data => {
        const target: Block | undefined = dimension.getBlock({ x: loc.x + data.x, y: loc.y + offsetY, z: loc.z + data.z });
        if (target) result.push(target);
    });
    return result.filter(data => data.typeId === "minecraft:air");
};

export type summonLineOption = {
    dimension: Dimension,
    location: Vector3,
    amount: number,
    entityId: string,
    per?: number,
    firstSpace?: number,
    interval?: number
};

export async function summonLine(option: summonLineOption, direction: Vector3): Promise<void> {
    let { dimension, location, amount, per, firstSpace, interval, entityId } = option;
    interval ??= 1; firstSpace ??= 1; per ??= 1;
    for (let i: number = 0; i < amount; i++) {
        await sleep(interval);
        if (i === 0) {
            location.x += direction.x * firstSpace;
            location.z += direction.z * firstSpace
        }
        const offset: number = i * per;
        const next: Vector3 = {
            x: location.x + direction.x * offset,
            y: location.y,
            z: location.z + direction.z * offset
        };
        if (dimension.getBlock(next)?.typeId !== "minecraft:air") {
            while (dimension.getBlock(next)?.typeId !== "minecraft:air") {
                next.y += 1;
            }
        } else if (dimension.getBlock({ x: next.x, y: next.y - 1, z: next.z })?.typeId === "minecraft:air") {
            while (dimension.getBlock({ x: next.x, y: next.y - 1, z: next.z })?.typeId === "minecraft:air") {
                next.y -= 1;
            }
        };
        dimension.spawnEntity(entityId as any, next);
    }

}

type Rotation = "right" | "left";
export async function summonCircle(location: Vector3, dimension: Dimension, entityId: string, radius: number, per: number, rotation: string) {
    const step = 360 / per;
    for (let i: number = 0; i < per; i++) {
        await sleep(1);
        const radian: number = step * i * (Math.PI / 180); 
        const next = {
            x: location.x + radius * (rotation === "right" ? Math.sin(radian) : Math.cos(radian)),
            y: location.y,
            z: location.z + radius * (rotation === "right" ? Math.cos(radian) : Math.sin(radian))
        };
        dimension.spawnEntity(entityId, next);
    }
}