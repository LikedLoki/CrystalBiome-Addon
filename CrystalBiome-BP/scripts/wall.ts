import { Entity, Block, Dimension, system, Vector3, BlockComponent, BlockComponentPlayerBreakEvent, BlockPermutation, BlockComponentTickEvent, BlockCustomComponent, world, Player } from "@minecraft/server";


interface ConnectionFour {
    "east": boolean,
    "west": boolean,
    "south": boolean,
    "north": boolean
};
interface ConnectionFive extends ConnectionFour {
    "up": boolean
}
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
const regex: RegExp = /slab$|stairs$|fence$|door$|trapdoor$|sign$|cluster$|bud$|skull$|head$|chest$|carpet$|flower$/;
function isConnectable(typeId: string): boolean {
    return !regex.test(typeId) && !exclusiveList.includes(typeId);
};

const offsetXZ: readonly Readonly<VectorDXZ>[] = [
    { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
]; Object.freeze(offsetXZ); for (let dataI = 0, lengI = offsetXZ.length; dataI < lengI; dataI++) Object.freeze(offsetXZ[dataI]);
const offsetXYZ: readonly Readonly<VectorDXYZ>[] = [
    { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 }, { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 }, { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 }
]; Object.freeze(offsetXYZ); for (let dataI = 0, lengI = offsetXYZ.length; dataI < lengI; dataI++) Object.freeze(offsetXYZ[dataI]);



export class WallAdmin {
    static updateWall(block: Block, dimension: Dimension) {
        const { x, y, z }: Vector3 = block.location;
        const selfConnect: ConnectionFive = { east: false, west: false, south: false, north: false, up: false };
        const upperConnect: ConnectionFour = { east: false, west: false, south: false, north: false };
        let upperIsWall: boolean = false;
        let sideConnectUp: boolean = false;
        for (let dataI: number = 0, lengI: number = offsetXZ.length; dataI < lengI; dataI++) {
            const { dx, dz }: VectorDXZ = offsetXZ[dataI];
            const sideBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y, z: z + dz });
            if (!sideBlock || !isConnectable(sideBlock?.typeId)) continue;
            if (dx === 1) selfConnect.east = true;
            if (dx === -1) selfConnect.west = true;
            if (dz === 1) selfConnect.south = true;
            if (dz === -1) selfConnect.north = true;
            if (!sideBlock.hasTag("cb2:is_wall")) continue;
            if (sideBlock.permutation.getState("cb2:connect_up" as any)) sideConnectUp = true;
        }
        const upperBlcok: Block | undefined = block.above();
        if (!upperBlcok) return;
        upperIsWall = upperBlcok.hasTag("cb2:is_wall");
        selfConnect.up = upperBlcok.typeId !== "minecraft:air";
        if (upperIsWall) {
            upperConnect.east = upperBlcok.permutation.getState("cb2:connect_east" as any);
            upperConnect.west = upperBlcok.permutation.getState("cb2:connect_west" as any);
            upperConnect.south = upperBlcok.permutation.getState("cb2:connect_south" as any);
            upperConnect.north = upperBlcok.permutation.getState("cb2:connect_north" as any);
        }
        const curPerm = block.permutation;
        const newPerm = curPerm
            .withState("cb2:connect_east" as any, selfConnect.east)
            .withState("cb2:connect_west" as any, selfConnect.west)
            .withState("cb2:connect_south" as any, selfConnect.south)
            .withState("cb2:connect_north" as any, selfConnect.north)
            .withState("cb2:connect_up" as any, selfConnect.up)
            .withState("cb2:upconnect_east" as any, upperConnect.east)
            .withState("cb2:upconnect_west" as any, upperConnect.west)
            .withState("cb2:upconnect_south" as any, upperConnect.south)
            .withState("cb2:upconnect_north" as any, upperConnect.north)
            .withState("cb2:upconnect_iswall" as any, upperIsWall)
            .withState("cb2:side_upconnect" as any, sideConnectUp);
        if (curPerm.matches(newPerm.type.id, newPerm.getAllStates())) return;
        block.setPermutation(newPerm);
        this.updateNearby(block, dimension);
    }
    static updateNearby(block: Block, dimension: Dimension) {
        const { x, y, z }: Vector3 = block.location;
        for (let dataI = 0, lengI = offsetXYZ.length; dataI < lengI; dataI++) {
            const { dx, dy, dz }: VectorDXYZ = offsetXYZ[dataI];
            const getBlock: Block | undefined = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
            if (!getBlock || !getBlock.hasTag("cb2:is_wall")) continue;
            this.updateWall(getBlock, dimension);
        }
    }
}

export const Wall: BlockCustomComponent = {
    onPlace({ block, dimension }) {
        WallAdmin.updateWall(block, dimension);
    },
    onBreak({ block, dimension }) {
        WallAdmin.updateNearby(block, dimension);
    }
};