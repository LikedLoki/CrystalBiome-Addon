import { system, ItemStack, BlockPermutation, BlockComponentOnPlaceEvent, Block, Dimension, Vector3, BlockComponentBlockBreakEvent, BlockComponentPlayerInteractEvent, BlockComponentPlayerBreakEvent, BlockCustomComponent, VectorXZ, CustomComponentParameters } from "@minecraft/server";

interface DoorInfo {
    name: string,
    open: string,
    close: string;
};

type FourRot = "east" | "west" | "south" | "north";
type VerticalType = "up" | "down";

const offset: Record<string, Record<"dx" | "dz", number>> = {
    "east": { dx: 0, dz: -1 },
    "west": { dx: 0, dz: 1 },
    "south": { dx: 1, dz: 0 },
    "north": { dx: -1, dz: 0 }
}

class DoorAdmin {
    // ==== クラスの初期宣言 ====
    dim: Dimension;
    param: DoorInfo;
    doorName: `cb2:${string}_door` = "cb2:crystal_door";
    up: Block | undefined = undefined;
    down: Block | undefined = undefined;
    side: Block | undefined = undefined;
    facing: FourRot = "east";
    open: boolean = false;
    reverse: 0 | 1 = 0;
    // ==== コンストラクター ====
    constructor(dim: Dimension, param: DoorInfo) {
        this.dim = dim;
        this.param = {
            "name": param.name,
            "open": param.open ?? "open_door.copper",
            "close": param.close ?? "close_door.copper"
        };
        this.doorName = `cb2:${param.name}_door`;
    }
    // ==== 開閉状態を定める関数 ====
    setOpen() {
        if (!this.down) return;
        this.open = !!this.down.permutation.getState("cb2:open" as any);
    }
    // ==== ドアの向きを定める関数 ====
    setFacing() {
        if (!this.down) return;
        this.facing = (this.down.permutation.getState("minecraft:cardinal_direction") ?? "east") as FourRot;
    }
    // ==== 隣のブロックを取る関数 ====
    setSide() {
        if (!this.down || !this.facing) return;
        const { x, y, z } = this.down.location;
        const { dx, dz } = offset[this.facing];
        this.side = this.dim.getBlock({ x: x + dx, y: y, z: z + dz });
    }
    // ==== 真上が空気か確かめて、空気ならtrue、そうでないなら後処理をしてfalseを返す関数 ====
    #ensureAbove(): boolean {
        if (!this.down || !this.up) return false;
        if (!this.up?.isAir) {
            this.down.setType("minecraft:air");
            return false;
        }
        return true;
    }
    // ==== "open"か"reverse"をblockstateに適応する関数 ====
    #applyState(target: "facing" | "open" | "reverse"): boolean {
        if (!this.up || !this.down) return false;
        if (target === "facing") {
            this.up.setPermutation(this.up.permutation.withState("minecraft:cardinal_direction" as any, this.facing));
            this.down.setPermutation(this.down.permutation.withState("minecraft:cardinal_direction" as any, this.facing));
        } else if (target === "open") {
            this.up.setPermutation(this.up.permutation.withState("cb2:open" as any, +this.open));
            this.down.setPermutation(this.down.permutation.withState("cb2:open" as any, +this.open));
        } else {
            this.up.setPermutation(this.up.permutation.withState("cb2:reverse" as any, this.reverse));
            this.down.setPermutation(this.down.permutation.withState("cb2:reverse" as any, this.reverse));
        }
        return true;
    }
    // ==== ドアの下ブロックを設定する関数 ====
    setTheDown(block: Block) {
        this.down = block;
    }
    // ==== ドアの上ブロックを設定する関数 ====
    setTheUp(block: Block) {
        this.up = block;
    }
    // ==== ドアの設置工程をまとめた関数 ====
    place(): boolean {
        if (!this.down || !this.side) return false;
        this.up = this.down.above();
        if (!this.#ensureAbove()) return false;
        const { x, y, z } = this.down.location;
        this.dim.setBlockType({ x: x, y: y + 1, z: z }, `cb2:${this.param.name}_door_up`);
        console.log(this.side.typeId === this.down.typeId)
        if (this.side.typeId === this.down.typeId) this.reverse = 1;
        else this.reverse = 0;
        this.#applyState("facing");
        this.#applyState("reverse");
        this.#applyState("open");
        return true;
    }
    // ==== (下が壊された)ドアの破壊工程をまとめた関数 ====
    breakTheDown() {
        if (!this.down) return;
        this.up = this.down.above();
        if (this.up?.typeId !== this.doorName + "_up") return;
        this.dim.setBlockType(this.up.location, "minecraft:air");
        this.#dropAItem();
    }
    // ==== (上が壊された)ドアの破壊工程をまとめた関数 ====
    breakTheUp() {
        if (!this.up) return;
        this.down = this.up.below();
        if (this.down?.typeId !== this.doorName + "_down") return;
        this.dim.setBlockType(this.down.location, "minecraft:air");
        this.#dropAItem();
    }
    // ==== アイテムをドロップさせる関数 ====
    #dropAItem() {
        if (!this.down) return;
        const drop = new ItemStack(this.doorName + "_item", 1);
        this.dim.spawnItem(drop, this.down.center());
    }
    // ==== ドアの開閉を行う関数 ====
    #ToggleADoor() {
        if (!this.down) return;
        this.open = !this.open;
        this.#applyState("open");
        this.dim.playSound(this.open ? this.param.open : this.param.close, this.down.center());
    }
    // ==== ドアの開閉処理をまとめた関数 ====
    toggle(type: VerticalType) {
        if (!this[type]) return;
        const rev: VerticalType = type === "down" ? "up" : "down";
        this[rev] = rev === "up" ? this[type].above() : this[type].below();
        if (!this[rev]) return;
        if (rev === "up") this.setTheUp(this[rev]);
        else this.setTheDown(this[rev]);
        this.setOpen()
        this.#ToggleADoor();
    }
}

export const DoorDown: BlockCustomComponent = {
    onPlace({ block, dimension }, { params }) {
        const param = params as DoorInfo;
        const door = new DoorAdmin(dimension, param);
        door.setTheDown(block);
        door.setFacing();
        door.setSide();
        door.place();
    },
    onBreak({ block, dimension }, { params }) {
        const param = params as DoorInfo;
        const door = new DoorAdmin(dimension, param);
        door.setTheDown(block);
        door.breakTheDown();
    },
    onPlayerInteract({ block, dimension }, { params }) {
        const param = params as DoorInfo;
        const door = new DoorAdmin(dimension, param);
        door.setTheDown(block);
        door.toggle("down");
    }
};
export const DoorUp: BlockCustomComponent = {
    onBreak({ block, dimension }, { params }) {
        const param = params as DoorInfo;
        const door = new DoorAdmin(dimension, param);
        door.setTheUp(block);
        door.breakTheUp();
    },
    onPlayerInteract({ block, dimension }, { params }) {
        const param = params as DoorInfo;
        const door = new DoorAdmin(dimension, param);
        door.setTheUp(block);
        door.toggle("up");
    }
};