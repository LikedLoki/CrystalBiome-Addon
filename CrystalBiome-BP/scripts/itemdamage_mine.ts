import { system, EquipmentSlot, Player, ItemCustomComponent, EntityEquippableComponent, ItemStack, ContainerSlot, GameMode, ItemDurabilityComponent, ItemEnchantableComponent, EnchantInfo, Enchantment, Container, Entity } from "@minecraft/server";

export const MineDamage: ItemCustomComponent = {
	onMineBlock({ source, itemStack }) {
		if (!itemStack || !(source instanceof Player)) return;

		const container = source.getComponent("minecraft:inventory")?.container;
		if (!container) return;

		const durability = itemStack.getComponent("minecraft:durability");
		if (!durability) return;

		if (durability.damage >= durability.maxDurability) {
			source.dimension.playSound("random.break", source.location);
			container.setItem(source.selectedSlotIndex)
		} else {
			durability.damage++;
		container.setItem(source.selectedSlotIndex, itemStack);
		}
		
	}
};