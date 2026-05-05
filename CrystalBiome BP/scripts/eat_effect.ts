import { Entity, ItemComponentConsumeEvent, Player, system, CustomComponentParameters } from "@minecraft/server";

const Consume: any = {
    onConsume(event: ItemComponentConsumeEvent, data: { params: { name: string, duration: number, amplifier: number }[] }) {
        const { params } = data;
        const source: Entity = event.source;
        for (const newpar of params) {
            source.addEffect(newpar.name, Number(newpar.duration), {
                amplifier: Number(newpar.amplifier),
                showParticles: true
            });
        };
    }
};

system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent("cb2:eat_effect", Consume);
});