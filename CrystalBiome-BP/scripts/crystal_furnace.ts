import { Block, BlockCustomComponent, system, Vector3 } from "@minecraft/server"
import { Color, crystalBiomeEvent, particleColor } from "./crystal-biome"
import { buildLocName, parseLocName, sleep } from "./other"

type FuelTypeId = typeof fuelList[number];
type FuelBlock = Block & { typeId: FuelTypeId };

/**
 * 燃料として使用可能なブロックの定義。
 */
const fuelList = [
    "cb2:flare_crystal_block"
] as const;

/* ========燃料に関する関数======== */
/**
 * 引数に渡されたBlockが燃料ブロックならtrueを返し、FuelBlockとする。そうでないならfalseを返す。
 */
const isFuel = (block: Block): block is FuelBlock => fuelList.includes(block.typeId as typeof fuelList[number]);
/**
 * 引数に燃料ブロックを受け取り、残量を返す。
 */
const getRemainingFuel = (block: FuelBlock): number => +(block.permutation.getState("cb2:fuel" as any) || 0);
/**
 * 引数に燃料ブロックを受け取り、燃料を消費する。0になったらcb2:deep_crystal_blockに置き換える。
 */
const fuelConsume = (block: FuelBlock) => {
    const next: number = getRemainingFuel(block) - 1;
    if (next > 0) block.setPermutation(block.permutation.withState("cb2:fuel" as any, next));
    else block.setType("cb2:deep_crystal_block")
}

/* ========水晶炉に対する操作関数======== */
/**
 * 引数に水晶炉を受け取り、着火する。
 */
const furnaceIgnition = (block: Block) => block.setPermutation(block.permutation.withState("cb2:lit" as any, true));
/**
 * 引数に水晶炉を受け取り、消化する。
 */
const furnaceFizz = (block: Block) => block.setPermutation(block.permutation.withState("cb2:lit" as any, false));
/**
 * 引数に水晶炉を受け取り、着火状態ならtrue、消化状態ならfalseを返す。
 */
const getFurnaceLit = (block: Block): boolean => !!block.permutation.getState("cb2:lit" as any);

export const CrystalFurnace: BlockCustomComponent = {
    onPlace({ block }) {
        const below: Block | undefined = block.below();
        if (!below || below.typeId !== "cb2:flare_crystal_block") return;
        below.setPermutation(below.permutation.withState("cb2:powered" as any, true).withState("cb2:fuel" as any, 15));
    },
    async onPlayerInteract({ dimension, block }) {
        // 真下のブロックが燃料じゃないなら切り返し。
        const below: Block | undefined = block.below();
        if (!below || !isFuel(below)) return;

        //もし既に水晶炉が着火されてるなら、値を初期化し、水晶炉を消火。そして切り返す。
        if (getFurnaceLit(block)) {
            furnaceFizz(block);
            dimension.playSound("random.fizz", block.center());
            block.getComponent("minecraft:dynamic_properties")?.set("cb2:times", 0);
            return;
        }

        // 燃料の残量が0以下なら切り返す。
        let remainingFuel: number = getRemainingFuel(below);
        if (remainingFuel < 1) return;

        // 燃料を消費し、水晶炉を着火する。
        fuelConsume(below);
        dimension.spawnParticle("cb2:powered_flare", below.center());
        dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
        furnaceIgnition(block);
    },
    onTick({ dimension, block }) {
        // 水晶炉の情報取得
        const prop = block.getComponent("minecraft:dynamic_properties");
        if (!prop) return;

        //真下のブロックが燃料じゃないなら、水晶炉を消火し、切り返す。
        const below: Block | undefined = block.below();
        if (!below || !isFuel(below)) {
            furnaceFizz(block);
            dimension.playSound("random.fizz", block.center());
            return;
        }
        // イベントトリガーを発行する。
        crystalBiomeEvent.publish("furnace_lit", { location: block.location, dimension: dimension })

        // 一定時間ごとに燃料を消費し、演出を行う。
        const currTimes: number = +(prop.get("cb2:times") || 0)
        if (currTimes < 9) prop.set("cb2:times", currTimes + 1);
        else {
            fuelConsume(below);
            particleColor.setColorRGB("variable.color", Color.flare)
            for (let i = 0; i < 8; i++) dimension.spawnParticle("cb2:crystal_particle_disc", below.center(), particleColor);
            dimension.playSound("mob.blaze.shoot", block.center(), { pitch: 2 });
            prop.set("cb2:times", 0)
        }

    }
}