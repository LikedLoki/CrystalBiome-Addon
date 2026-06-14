import { ItemCustomComponent } from "@minecraft/server";

export const EatEffect: ItemCustomComponent = {
    onConsume({ source }, { params }) {
        if (typeof params !== "object" || params === null) return;
        if (!("name" in params) || !("duration" in params) || !("amplifier" in params)) return;
        if (typeof params.name !== "string" || typeof params.duration !== "number" || typeof params.amplifier !== "number") return;
        source.addEffect(params.name, params.duration, { amplifier: params.amplifier });
    }
}