import { Block, BlockPermutation, Dimension, Entity, EntityApplyDamageOptions, EntityDamageCause, ItemCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server";
const offset: Vector3[] = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
]
const GCPick: ItemCustomComponent = {
    onMineBlock({ block, minedBlockPermutation }, data) {
        const params = data.params as { chance: number, chain: number };
        if (Math.random() > params.chance) return;
        const dimension: Dimension = block.dimension;
        const mined: BlockPermutation = minedBlockPermutation;
        const minedID: string = mined.type.id;
        const box: Vector3[] = [];
        const { x, y, z }: Vector3 = block.location;
        let flag: boolean = false;
        for (const o of offset) {
            const hmm: Block | undefined = dimension.getBlock({ x: x + o.x, y: y + o.y, z: z + o.z });
            if (!hmm || hmm.typeId !== minedID) return;
            box.push({ x: x + o.x, y: y + o.y, z: z + o.z });
            flag = true;
        };
        for (let i: number = 0; i < params.chain; i++) {
            const select: Vector3 = box[Math.floor(Math.random() * box.length)];
            if (!select) return;
            dimension.runCommand(`setblock ${select.x} ${select.y} ${select.z} air destroy`);
            const vars: MolangVariableMap = new MolangVariableMap();
            vars.setColorRGB("variable.color", { red: 0.2, green: 1, blue: 0.75 });
            dimension.spawnParticle("cb2:crystal_particle", block.center(), vars)
            dimension.spawnParticle("cb2:crystal_particle", { x: select.x + 0.5, y: select.y + 0.5, z: select.z + 0.5 }, vars);
            box.splice(box.indexOf(select), 1);
        }
    }
};

function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
}

const GCsword: ItemCustomComponent = {
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
}


system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent("cb2:gc_pick", GCPick);
    itemComponentRegistry.registerCustomComponent("cb2:gc_sword", GCsword);
});
