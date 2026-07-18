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

export type LocationName = `${string}|${string}|${string}`;
export const parseLocName = (locName: LocationName): Vector3 => {
    const [x, y, z] = locName.split("|");
    return {
        x: parseInt(x, 36),
        y: parseInt(y, 36),
        z: parseInt(z, 36),
    }
}
export const buildLocName = (location: Vector3): LocationName => `${location.x.toString(36)}|${location.y.toString(36)}|${location.z.toString(36)}`;