import { world, system, Entity, Dimension, MolangVariableMap,VanillaEntityIdentifier, Vector3, VectorXZ, Block } from "@minecraft/server";
export const sleep = (tick: number) => new Promise<void>(resolve => system.runTimeout(() => {resolve()}, tick));

export function CrystalSpawn(name: string, pos: Vector3, dimension: Dimension, tag: string | null): void {
    const selectColor: string = ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)];
    const vars: MolangVariableMap = new MolangVariableMap();
    switch (selectColor) {
        case "red": vars.setColorRGB("variable.color", { red: 1, green: 0.5, blue: 0.5 }); break;
        case "green": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 }); break;
        case "blue": vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 1 }); break;
        case "yellow": vars.setColorRGB("variable.color", { red: 1, green: 1, blue: 0.25 }); break;
    };
    dimension.playSound("cbspawner_detect", pos);
    dimension.spawnParticle("cb2:cbspawn_particle", pos, vars);
    if (!tag) { dimension.spawnEntity(name as VanillaEntityIdentifier, pos, { spawnEvent: `cb2:color_${selectColor}` }); return; }
    dimension.spawnEntity(name as VanillaEntityIdentifier, pos, { spawnEvent: `cb2:color_${selectColor}` }).addTag(tag);
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
    per: number,
    firstSpace: number,
    interval: number,
    entityId: string
};

export async function summonLine(option: summonLineOption, direction: Vector3): Promise<void> {
    const { dimension, location, amount, per, firstSpace, interval, entityId } = option;
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
        dimension.spawnEntity(entityId as any, next);
    }

}