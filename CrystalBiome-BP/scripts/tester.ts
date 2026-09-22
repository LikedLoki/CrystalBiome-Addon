import { world, ItemStack, Block, Player, BlockComponentEntityEvent, Entity, Vector3, Dimension } from "@minecraft/server";
import { chainSpike, CrystalHorizonResetFn, growSpike, KingCastleGenerator } from "./crystal_horizon";

world.afterEvents.chatSend.subscribe(async ({ message, sender }) => {
    await chainSpike(
    sender.dimension,
    sender.location, // 開始位置
    { x: 0, y: 1, z: 0 },      // 上方向
    6,                         // 初期半径
    32,                        // 初期高さ
    9,                         // 最大世代数
    0.5                        // 分岐確率 (30%)
);
    /*const a: string[] = message.split(" ");
    if (a[0] === "#") {
        if (!world.getDynamicProperty(a[1])) {
            world.sendMessage("???")
            return;
        }
        world.setDynamicProperty(a[1], a[2] === "undefined" ? undefined : a[2]);
    } else if (a[0] === "$") {
        world.sendMessage(JSON.stringify(world.getDynamicProperty(a[1])));
    }*/
})

