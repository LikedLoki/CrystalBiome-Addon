import { Entity } from "@minecraft/server";


export type GuardWonderId = "cb2:crystal_guard" | "cb2:crystal_wander";
export type GuardWonderEntity = Entity & { "typeId": GuardWonderEntity };
export type CrystColor = "red" | "green" | "blue" | "yellow";
export type CrystRGB = { "red": number, "green": number, "blue": number };
export type VectorDXYZ = { "dx": number, "dy": number, "dz": number };