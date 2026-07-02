import { Entity, ItemStack, Vector2, Vector3, world, World } from "@minecraft/server";

type PropertyTypes = string | number | boolean | Vector3;
type AssignTypes = "string" | "number" | "boolean" | "Vector3";

const getProperty = <T extends AssignTypes>(target: World | Entity | ItemStack, name: string, assignType: T): T | undefined => {
    const newT = assignType === "Vector3" ? "object" : assignType;
    const getProp: PropertyTypes | undefined = target.getDynamicProperty(name);
    if (typeof getProp !== assignType) return;
}
getProperty(world.getEntity("cb2:crystal_block")!, "d", "string")