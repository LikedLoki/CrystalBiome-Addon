import { world } from "@minecraft/server";

// 重み付きランダム選択関数
/**
 * 配列から重みに応じてランダムに要素を選択します。
 * @param {Array<{weight: number}>} items - weightプロパティを持つ要素の配列
 * @returns {any} 選択された要素
 */
function selectByWeight(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    let randomValue = Math.random() * totalWeight;

    for (const item of items) {
        if (randomValue < item.weight) {
            return item;
        }
        randomValue -= item.weight;
    }
}

const YellowPiackaxeEffect = {
    onMineBlock({ source }) {
        if (Math.random() > 0.1) return;
        const effectlevel = [
            { level: 0, duration: 300, weight: 7 }, //70%
            { level: 1, duration: 200, weight: 2 }, //20%
            { level: 2, duration: 100, weight: 1 }  //10%
        ];
        const selectedEffect = selectByWeight(effectlevel);
        source.addEffect("haste", selectedEffect.duration, {
            amplifier: selectedEffect.level,
            showParticles: true
        });
    }
};

// 登録処理 (変更なし)
world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
        "cb2:yellow_pickaxe_haste",
        YellowPiackaxeEffect
    );
});