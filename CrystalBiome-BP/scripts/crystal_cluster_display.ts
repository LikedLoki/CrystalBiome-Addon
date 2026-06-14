import { Block, BlockComponentTickEvent, BlockCustomComponent, MolangVariableMap, system, Vector3 } from "@minecraft/server";
let vars: MolangVariableMap;
system.run(() => vars = new MolangVariableMap());

type ClusterTypeId = keyof typeof clusterMap;
type ClusterBlock = Block & { "typeId": ClusterTypeId };
type ClusterInfo = typeof clusterMap[ClusterTypeId]
type SelectColor = ClusterInfo["rgb"];
type SelectParticle = ClusterInfo["particle"];

const clusterMap = {
    "cb2:blue_crystal_cluster": { particle: "cb2:crystal_display_particle", rgb: { red: 0.2, green: 1, blue: 1 }},
    "cb2:red_crystal_cluster": { particle: "cb2:crystal_display_particle", rgb: { red: 1, green: 0.5, blue: 0.5 }},
    "cb2:green_crystal_cluster": { particle: "cb2:crystal_display_particle", rgb: { red: 0.2, green: 1, blue: 0.75 }},
    "cb2:yellow_crystal_cluster": { particle: "cb2:crystal_display_particle", rgb: { red: 1, green: 1, blue: 0.25 }},
    "cb2:rare_crystal_cluster": { particle: "cb2:crystal_display_particle", rgb: { red: 0, green: 0.8, blue: 0.8 }}
 } as const;

const isCluster = (block: Block): block is ClusterBlock => block.typeId in clusterMap;

const main = ({ dimension, block }: BlockComponentTickEvent) => {
    const aboveBlock: Block | undefined = block.above();
    if (!aboveBlock || !isCluster(aboveBlock)) return;

    const clusterInfo: ClusterInfo = clusterMap[aboveBlock.typeId];
    const selectColor: SelectColor = clusterInfo["rgb"];
    const selectParticle: SelectParticle = clusterInfo["particle"];

    vars.setColorRGB("variable.color", selectColor);
    dimension.spawnParticle(selectParticle, aboveBlock.center(), vars);
};

export const Display: BlockCustomComponent = {
    onTick: (event: BlockComponentTickEvent) => main(event)
};