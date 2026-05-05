import { BlockCustomComponent, system, Vector3 } from "@minecraft/server";

const CrystalOak: BlockCustomComponent = {
    onTick({ block, dimension }) {
        const offset: Vector3[] = [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }
        ];
        const { x, y, z }: Vector3 = block.location;
        const onHold: boolean = offset.every(data => dimension.getBlock({ x: x + data.x, y: y + data.y, z: z + data.z })?.typeId !== "minecraft:air");
        if (onHold) return;
        dimension.spawnParticle("cb2:crystaloak_particle", block.center());
    }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        "cb2:crystaloak_particle",
        CrystalOak
    );
});