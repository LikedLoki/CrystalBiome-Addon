import { system, EquipmentSlot, Player, ItemCustomComponent, EntityEquippableComponent, ItemStack, ContainerSlot, GameMode, ItemDurabilityComponent, ItemEnchantableComponent, EnchantInfo, Enchantment, Container, Entity } from "@minecraft/server";

export const MineDamage: ItemCustomComponent = {
	onMineBlock({ source }, data) {
		const params = data.params as { value: number };
		if (!(source instanceof Player)) return;
		const equippable: EntityEquippableComponent | undefined = source.getComponent("minecraft:equippable");
		if (!equippable) return;
		const mainhand: ContainerSlot = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
		if (!mainhand.hasItem()) return;
		const gamemode: string = source.getGameMode();
		if (gamemode === "creative") return;
		const itemStack: ItemStack | undefined = mainhand.getItem();
		if (!itemStack) return;
		const durability: ItemDurabilityComponent | undefined = itemStack.getComponent("minecraft:durability");
		if (!durability) return;
		const enchantable: ItemEnchantableComponent | undefined = itemStack.getComponent("minecraft:enchantable");
		let unbreakingLevel: number = 0;
		if (enchantable) {
			const unbreaking: Enchantment | undefined = enchantable.getEnchantment("unbreaking");
			if (unbreaking) unbreakingLevel = unbreaking.level;
		}
		const damageChance: number = 1 / (unbreakingLevel + 1);
		if (Math.random() <= damageChance) {
			itemDamaged(durability, mainhand, itemStack, source);
		}
		function itemDamaged(durability: ItemDurabilityComponent, mainhand: ContainerSlot, itemStack: ItemStack, source: Player) {
			const shouldBreak: boolean = durability.damage >= durability.maxDurability;

			if (shouldBreak) {
				mainhand.setItem(undefined);
				source.playSound("crystal.break");
			} else {
				durability.damage += Number(params.value) ?? 1;
				mainhand.setItem(itemStack);
			}
		}
	}
};