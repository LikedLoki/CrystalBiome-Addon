import { BlockCustomComponent, Vector3 } from "@minecraft/server";
import { Color, particleColor } from "./crystal-biome";
import { sleep } from "./other";

const offsetList = [
    { direction: "east", dx: 1, dy: 0, dz: 0 },
    { direction: "west", dx: -1, dy: 0, dz: 0 },
    { direction: "up", dx: 0, dy: 1, dz: 0 },
    { direction: "down", dx: 0, dy: -1, dz: 0 },
    { direction: "south", dx: 0, dy: 0, dz: 1 },
    { direction: "north", dx: 0, dy: 0, dz: -1 }
] as const;

const exceptionList = [
    "cb2:blue_crystal_cluster", 
    "cb2:red_crystal_cluster", 
    "cb2:green_crystal_cluster", 
    "cb2:yellow_crystal_cluster", 
    "cb2:saline_crystal_cluster", 
    "cb2:flare_crystal_cluster",
    "cb2:rare_crystal_cluster",
    "cb2:blue_crystal_bud", 
    "cb2:red_crystal_bud", 
    "cb2:green_crystal_bud", 
    "cb2:yellow_crystal_bud", 
    "cb2:saline_crystal_bud", 
    "cb2:flare_crystal_bud",
    "cb2:rare_crystal_bud" 
]
export const ClosedCrystal: BlockCustomComponent = {
    async onTick({ dimension, block }, { params }) {
        const param = params as "blue" | "red" | "green" | "yellow"
        const { x, y, z } = block.center();
        const airDirections = [];
        for (const { direction, dx, dy, dz } of offsetList) {
            const targetLocation: Vector3 = { x: x + dx, y: y + dy, z: z + dz }
            const fetchedBlock = dimension.getBlock(targetLocation);
            if (!fetchedBlock?.isAir && !exceptionList.includes(fetchedBlock?.typeId ?? "")) continue;
            airDirections.push(direction);
        }
        const segment = Math.floor(6 / airDirections.length);
        for (const direction of airDirections) {
            for (let i = 0; i < segment; i++) {
                particleColor.setColorRGB("variable.color", Color[param]);
                try { dimension.spawnParticle(`cb2:closed_crystal_particle_${direction}`, block.center(), particleColor); }
                catch(_) {}
                await sleep(20)
            }
        }
    }
}