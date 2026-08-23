import { Block, BlockPermutation, Dimension, Entity, EntityApplyDamageOptions, EntityDamageCause, ItemCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server";
const chainOffset: Vector3[] = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
]

const getNearSomeBlock = (dimension: Dimension, location: Vector3, typeId: string): Block[] | undefined => {
    const blockList: Block[] = []
    const { x, y, z } = location;
    for (const { x: dx, y: dy, z: dz } of chainOffset) {
        const fetchedBlock = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
        if (!fetchedBlock || fetchedBlock.typeId !== typeId) continue;
        blockList.push(fetchedBlock)
    }
    return blockList.length === 0 ? undefined : blockList
}

const chainBreak = (dimension: Dimension, location: Vector3, typeId: string, currentCount: number, maxCount: number) => {
    // 最大回数まで連鎖したら切り返し。
    if (currentCount >= maxCount) return;

    // 破壊されたブロックと同じIDのブロックを隣接面から取得し、無ければ切り返し。
    const blockList: Block[] | undefined = getNearSomeBlock(dimension, location, typeId);
    if (!blockList) return;

    // 取得したブロックの中から無作為に一つ選択。
    const selected = blockList[Math.floor(Math.random() * blockList.length)];
    const { x, y, z } = selected
    
    dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`)
    chainBreak(dimension, selected.location, selected.typeId, currentCount+1, maxCount)
}

export const GCPick: ItemCustomComponent = {
    onMineBlock({ block, minedBlockPermutation }, { params }) {
        const param = params as number
        const { dimension, location } = block;
        chainBreak(dimension, location, minedBlockPermutation.type.id, 0, param)
    }
};

function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
}

export const GCsword: ItemCustomComponent = {
    onHitEntity({ hitEntity, attackingEntity }, data) {
        const params = data.params as { chance: number, chain: number, damage: number, radius: number };
        if (Math.random() > params.chance) return;
        const dimension: Dimension = hitEntity.dimension;
        let nearbyEntity: Entity[] = dimension.getEntities({
            location: hitEntity.location,
            maxDistance: params.radius
        });
        for (let i: number = nearbyEntity.length - 1; i >= 0; i--) {
            if ((nearbyEntity[i] === hitEntity || nearbyEntity[i] === attackingEntity) || !nearbyEntity[i].getComponent("minecraft:type_family")?.getTypeFamilies().includes("mob")) {
                nearbyEntity.splice(i, 1);
            }
        };
        if (!nearbyEntity[0]) return;
        const box: Entity[] = [];
        for (let i: number = 0; i < params.chain; i++) {
            const select: Entity = nearbyEntity[Math.floor(Math.random() * nearbyEntity.length)];
            if (box.includes(select)) break;
            box.push(select)
        };
        for (const select of box) {
            const vars: MolangVariableMap = new MolangVariableMap();
            vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 });
            const s = hitEntity.location;
            const e = select.location;
            const segment: number = params.radius * 2;
            for (let i = 0; i < segment; i++) {
                const per: number = i / segment;
                const px: number = lerp(s.x, e.x, per);
                const py: number = lerp(s.y, e.y, per);
                const pz: number = lerp(s.z, e.z, per);
                dimension.spawnParticle("cb2:crystal_particle", { x: px, y: py + 1, z: pz }, vars);
            }
            select.applyDamage(params.damage, { cause: EntityDamageCause.entityAttack, damagingEntity: attackingEntity });
        }
    }
};