import { Block, BlockComponentOnPlaceEvent, BlockComponentPlayerInteractEvent, Dimension, system, Vector3 } from "@minecraft/server";
const sleep: Function = (ticks: number) => new Promise<void>(resolve => system.runTimeout(resolve, ticks));
const Chest: any = {
    onPlayerInteract(event: BlockComponentPlayerInteractEvent) {
        const block: Block = event.block;
        const dimension: Dimension = block.dimension;
        const hiraiteru: boolean = block.permutation.getState("cb2:opend" as any)
        if (!hiraiteru) {
            dimension.playSound("random.chestopen", block.center());
            animationOpen(block);
        } else {
            dimension.playSound("random.chestclosed", block.center());
            animationClose(block);
        }
    },
    onPlace(event: BlockComponentOnPlaceEvent) {
        const block: Block = event.block;
        const dimension: Dimension = event.dimension;
        const { x, y, z }: Vector3 = block.center();
        const chestOffset: Vector3 = { x: 0.5, y: -0.25, z: 0.5 };
        const nameOffset: Vector3 = { x: 0.5, y: 0, z: 0.5 };
        const offsetX_name: number = block.location.x + nameOffset.x;
        const offsetY_name: number = block.location.y + nameOffset.y;
        const offsetZ_name: number = block.location.z + nameOffset.z;
        const offsetBlock: Block | undefined = dimension.getBlock({ x: offsetX_name, y: offsetY_name, z: offsetZ_name });
        if (!offsetBlock) return;
        let name: string;
        switch (offsetBlock.typeId) {
            case "cb2:crystal_chest":
                name = "蒼水晶のチェスト";
                break;
            case "cb2:red_crystal_chest":
                name = "紅水晶のチェスト";
                break;
            case "cb2:green_crystal_chest":
                name = "翠水晶のチェスト";
                break;
            case "cb2:yellow_crystal_chest":
                name = "黄水晶のチェスト";
                break;
            case "cb2:rare_crystal_chest":
                name = "希少石のチェスト";
                break;
            default:
                name = offsetBlock.typeId;
        }
        dimension.runCommand(`summon cb2:chestentity ${name} ${x} ${y + chestOffset.y} ${z}`);

    }
};

async function animationOpen(block: Block) {
    let level: number = block.permutation.getState("cb2:open" as any);
    for (let i: number = 0; i < 4; i++) {
        if (level >= 4) return;
        level++;
        block.setPermutation(
            block.permutation.withState("cb2:open" as any, level)
        );
        await sleep(1);
    };
    block.setPermutation(
        block.permutation.withState("cb2:opend" as any, true)
    );
};
async function animationClose(block: Block) {
    let level: number = block.permutation.getState("cb2:open" as any);

    for (let i: number = 0; i < 4; i++) {
        if (level <= 0) return;
        level--;
        block.setPermutation(
            block.permutation.withState("cb2:open" as any, level)
        );
        await sleep(1);
    };
    block.setPermutation(
        block.permutation.withState("cb2:opend" as any, false)
    );
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent("cb2:newchest", Chest);
});
