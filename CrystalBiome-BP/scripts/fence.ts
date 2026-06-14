import { Block, BlockCustomComponent, BlockPermutation, Dimension, system, Vector3, VectorXZ } from "@minecraft/server";

interface Rot4 {
    "east": boolean,
    "west": boolean,
    "south": boolean,
    "north": boolean
};
interface VectorDXZ {
    "dx": number,
    "dz": number
};
interface VectorDXYZ extends VectorDXZ {
    "dy": number
};

const exclusiveList: string[] = [
    "minecraft:air"
];
const regex: RegExp = /slab$|stairs$|wall$|door$|trapdoor$|sign$|cluster$|bud$|skull$|head$|chest$|carpet$|flower$/;
function isConnectable(typeId: string): boolean {
    return !regex.test(typeId) && !exclusiveList.includes(typeId);
};

const offsetXZ: readonly Readonly<VectorDXZ>[] = [
    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
]; Object.freeze(offsetXZ); for (let dataI = 0, lengI = offsetXZ.length; dataI < lengI; dataI++) Object.freeze(offsetXZ[dataI]);

const offsetXYZ: readonly Readonly<VectorDXYZ>[] = [
    { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 }, { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 }, { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 }
]; Object.freeze(offsetXYZ); for (let dataI = 0, lengI = offsetXYZ.length; dataI < lengI; dataI++) Object.freeze(offsetXYZ[dataI]);

export class FenceAdmin {
    static updateFence(block: Block, dimension: Dimension): void {
        const { x, y, z }: Vector3 = block.location;
        const connect: Rot4 = { "east": false, "west": false, "south": false, "north": false };
        for (let dataI: number = 0, lengI: number = offsetXZ.length; dataI < lengI; dataI++) {
            const { dx, dz }: VectorDXZ = offsetXZ[dataI];
            const sideBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
            if (!sideBlock) continue;
            if (!isConnectable(sideBlock.typeId)) continue;
            if (dx === 1) connect.east = true;
            if (dx === -1) connect.west = true;
            if (dz === 1) connect.south = true;
            if (dz === -1) connect.north = true;
        };
        const curPerm: BlockPermutation = block.permutation;
        const newPerm: BlockPermutation = curPerm
            .withState("cb2:connect_east" as any, connect.east)
            .withState("cb2:connect_west" as any, connect.west)
            .withState("cb2:connect_south" as any, connect.south)
            .withState("cb2:connect_north" as any, connect.north);
        if (!curPerm.matches(newPerm.type.id, newPerm.getAllStates())) {
            block.setPermutation(newPerm);
            this.updateNearby(block, dimension);
        }
    };
    static updateNearby(block: Block, dimension: Dimension) {
        const { x, y, z }: Vector3 = block.location;
        for (let dataI = 0, lengI = offsetXYZ.length; dataI < lengI; dataI++) {
            const { dx, dy, dz }: VectorDXYZ = offsetXYZ[dataI];
            const getBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
            if (!getBlock || !getBlock.hasTag("cb2:is_fence")) continue;
            this.updateFence(getBlock, dimension);
        }
    }
};

export const Fence: BlockCustomComponent = {
    onPlace({ block, dimension }) {
        FenceAdmin.updateFence(block, dimension);
    },
    onBreak({ block, dimension }) {
        FenceAdmin.updateNearby(block, dimension);
    }
};