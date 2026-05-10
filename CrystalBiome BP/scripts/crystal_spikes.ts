import { Entity, EntityDamageCause, MolangVariableMap, Player, system, world } from "@minecraft/server";
import { sleep } from "./other"

type configValue = {
    "damage": number;
    "playsound"?: string;
    "particle"?: string;
    "tick": number;
}

type configMap = {
    [key: string]: configValue
}

const spikeConfig: configMap = {
    "cb2:crystal_spike_executor": {
        "damage": 4,
        "playsound": "break.amethyst_block",
        "particle": "cb2:spike_particle",
        "tick": 10
    }
};
async function removeSpike(setting: configValue, entity: Entity) {
    await sleep(setting.tick);
    entity.remove();
}
world.afterEvents.entitySpawn.subscribe(async ({ entity }) => {
    if (!Object.keys(spikeConfig).includes(entity.typeId)) return;
    let vars = new MolangVariableMap;
    vars.setColorRGB("variable.color", { red: 0, green: 1, blue: 1 });
    const setting: configValue = spikeConfig[entity.typeId];
    if (setting.playsound !== undefined) entity.dimension.playSound(setting.playsound, entity.location);
    if (setting.particle !== undefined) entity.dimension.spawnParticle(setting.particle, entity.location, vars);
    const enemy: Entity | undefined = entity.dimension.getEntities({
        closest: 1,
        location: entity.location,
        maxDistance: 1.5,
        excludeFamilies: ["crystal"]
    })[0];
    if (enemy) enemy.applyDamage(setting.damage, { cause: EntityDamageCause.entityAttack, damagingEntity: entity });
    removeSpike(setting, entity);
})