import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").ItemCustomComponent} */
const YellowSwordRandomEffect = {
    onHitEntity({ hitEntity }) {
        const effects = [
            { id: "poison", duration: 120, amp: 0 },
            { id: "weakness", duration: 120, amp: 0 },
            { id: "slowness", duration: 120, amp: 0 }
        ];

        const randomEffect = effects[Math.floor(Math.random() * effects.length)];

        hitEntity.addEffect(randomEffect.id, randomEffect.duration, {
            amplifier: randomEffect.amp,
            showParticles: true
        });

    }
};

// 登録処理
world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
        "cb2:yellow_sword_poison",
        YellowSwordRandomEffect
    );
});
