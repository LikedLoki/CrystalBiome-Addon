import { Block, BlockCustomComponent, Container, Dimension, Entity, ItemStack, MolangVariableMap, Player, system, Vector3, world } from "@minecraft/server";
import { sleep } from "./other";
import { PrismInfoAdmin } from "./prism-info-fn";
import { PrismInfo } from "./crystal-biome";

let var1: MolangVariableMap;
system.run(() => var1 = new MolangVariableMap())

const offset = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 }
] as const;

type n = number;
type Facing = { dx: number; dy: number; dz: number };
type State = `${number}|${number}|${number}|${number}|${number}|${number}|${number}|${number}|${number}`;
type Check = typeof checkMap[keyof typeof checkMap] | "stop";

const checkMap = {
    "minecraft:air": "none",
    "cb2:reflection_left_block": "left",
    "cb2:reflection_right_block": "right",
    "cb2:reflection_up_block": "up",
    "cb2:reflection_down_block": "down",
    "cb2:resonance_node_block": "energy",
    "cb2:clear_crystal_block": "split_side",
    "cb2:clear_red_crystal_block": "split_vertical"
} as const;

// ベクトルの正規化
const normalize = (v: Vector3): Vector3 => {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 1, y: 0, z: 0 }; // フォールバック
    return { x: v.x / length, y: v.y / length, z: v.z / length };
};

// クロス積 (外積) a × b
const cross = (a: Vector3, b: Vector3): Vector3 => {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
};

// ベクトルの反転 (-v)
const negate = (v: Vector3): Vector3 => {
    return { x: -v.x, y: -v.y, z: -v.z };
};

class Raycast {
    location: Vector3;
    facing: Vector3;
    #upVec: Vector3;
    step: number = 0;
    record: Set<string>;
    particle: boolean = true;

    constructor(loc: Vector3, facing: Vector3, up: Vector3, record: Set<string>) {
        this.location = loc;
        this.facing = normalize(facing);
        // upVec は facing と直交するベクトルである前提。正規化しておく
        this.#upVec = normalize(up);
        this.record = record;
    }

    get #state(): State {
        const l = this.location;
        const f = this.facing;
        const u = this.#upVec;
        return `${l.x}|${l.y}|${l.z}|${f.x}|${f.y}|${f.z}|${u.x}|${u.y}|${u.z}`;
    }

    #recordCheck(state: State): boolean {
        if (this.record.has(state)) return true;
        this.record.add(state);
        return false;
    }

    #blockCheck(typeId: string | undefined): Check {
        if (
            typeId === undefined ||
            !(typeId in checkMap)
        ) return "stop";
        return checkMap[typeId as keyof typeof checkMap];
    }
    
    async forward(dimension: Dimension) {
        for (let i = 0; i < 8; i++) {
            if (this.#recordCheck(this.#state)) break;
            const block = dimension.getBlock(this.location);
            const check = this.#blockCheck(block?.typeId);

            if (check === "stop" || !block) break;
            else if (check === "left" || check === "right" || check === "up" || check === "down") {
                const { x, y, z } = block!.center();

                // 現在のレイの座標系 (f, u, r) を定義
                const f = this.facing;
                const u = this.#upVec;
                const r = normalize(cross(f, u)); // 右ベクトル

                // 新しい進行方向 (f_new) と上ベクトル (u_new) を計算
                let f_new: Vector3;
                let u_new: Vector3;

                if (check === "up") {
                    // 現在のレイの「上」に屈折
                    f_new = u;
                    u_new = negate(f); // 新しい「上」は元の「後ろ」
                } else if (check === "down") {
                    // 現在のレイの「下」に屈折
                    f_new = negate(u);
                    u_new = negate(f); // 新しい「上」は元の「後ろ」
                } else if (check === "left") {
                    // 現在のレイの「左」に屈折 (右の逆)
                    f_new = negate(r);
                    u_new = u; // 「上」は維持
                } else { // check === "right"
                    // 現在のレイの「右」に屈折
                    f_new = r;
                    u_new = u; // 「上」は維持
                }

                // 新しいレイの発射位置 (屈折した方向に1ブロック先)
                const newLocation: Vector3 = { x: x + f_new.x, y: y + f_new.y, z: z + f_new.z };

                // 計算した方向と上ベクトルで新しいレイを作成
                const ray = new Raycast(newLocation, f_new, u_new, this.record);
                ray.forward(dimension);

                dimension.playSound("random.pop", { x: x, y: y, z: z }, { "pitch": 3 });
                break;
            } else if (check === "split_side") {
                const { x, y, z } = block!.center();

                const f = this.facing;
                const u = this.#upVec;
                const r = normalize(cross(f, u));

                // 左右に分裂 (上ベクトルは維持)
                const f_left = negate(r);
                const f_right = r;

                const leftRay = new Raycast({ x: x + f_left.x, y: y + f_left.y, z: z + f_left.z }, f_left, u, this.record);
                const rightRay = new Raycast({ x: x + f_right.x, y: y + f_right.y, z: z + f_right.z }, f_right, u, this.record);

                leftRay.forward(dimension);
                rightRay.forward(dimension);
                break;
            } else if (check === "split_vertical") {
                const { x, y, z } = block!.center();

                const f = this.facing;
                const u = this.#upVec;

                // 上下に分裂
                const f_up = negate(u);
                const f_down = u;
                const u_new = negate(f)

                const upRay = new Raycast({ x: x + f_up.x, y: y + f_up.y, z: z + f_up.z }, f_up, u_new, this.record);
                const downRay = new Raycast({ x: x + f_down.x, y: y + f_down.y, z: z + f_down.z }, f_down, u_new, this.record);

                upRay.forward(dimension);
                downRay.forward(dimension);
                break;
            } else if (check === "energy") {
                block.setPermutation(block.permutation.withState("cb2:bool_I" as any, true));
                block.setPermutation(block.permutation.withState("cb2:energy" as any, 4));
                const rne = dimension.getEntities({ type: "cb2:resonance_node_entity", location: block.center(), maxDistance: 1 });
                if (rne.length === 0) dimension.spawnEntity("cb2:resonance_node_entity" as any, block.center())
                break;
            }

            dimension.spawnParticle(
                "cb2:prismstone_line_particle",
                this.location
            );

            // 前進 (facing.x, facing.y, facing.z を使用)
            this.location.x += this.facing.x;
            this.location.y += this.facing.y;
            this.location.z += this.facing.z;

            if (i % 2 === 0) await sleep(1);
        }
    }
}

const radiationPrism = (dimension: Dimension, block: Block) => {
    const { x, y, z } = block.center();
    for (const { dx, dz } of offset) {
        const ray = new Raycast({ x: x + dx, y: y, z: z + dz }, { x: dx, y: 0, z: dz }, { x: 0, y: 1, z: 0 }, new Set());
        ray.forward(dimension);
    }
}

export const PrismStone: BlockCustomComponent = {
    onPlace({ dimension, block }) {
        radiationPrism(dimension, block)
    },
    onTick({ dimension, block }) {
        radiationPrism(dimension, block);
    }
};

export const RestorationPrism: BlockCustomComponent = {
    async onPlayerInteract({ dimension, block, player }) {
        if (!player) return;
        const container: Container | undefined = player.getComponent("minecraft:inventory")?.container;
        const item: ItemStack | undefined = container?.getItem(player.selectedSlotIndex);
        if (!container || !item || item.typeId !== "cb2:crystal_heart_shard") return;
        
        const nxtAmnt = item.amount - 1;
        if (nxtAmnt > 0) {
            item.amount--;
            container?.setItem(player.selectedSlotIndex, item);
        } else {
            container?.setItem(player.selectedSlotIndex, undefined);
        }
        
        block.setType("cb2:prismstone");
        dimension.spawnParticle("cb2:prismstone_startup_particle", block.center());
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 2 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 2 });
        await sleep(1);
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1.5 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1.5 });
        await sleep(1);
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1 });
        dimension.playSound("break.amethyst_cluster", block.center(), { pitch: 1 });
    }
}