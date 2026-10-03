import { ItemCustomComponent, ItemStack, Player, PlayerSpawnAfterEvent, World, world } from "@minecraft/server";
import { CustomForm, ObservableNumber } from "@minecraft/server-ui";

export const giveSetLang = ({ initialSpawn, player }: PlayerSpawnAfterEvent) => {

    if (player.getDynamicProperty("cb2:player_language") !== undefined) return;
    const { dimension } = player;
    dimension.spawnItem(new ItemStack("cb2:lang_set_paper"), player.location);
}

type Language = keyof typeof systemMessageMap
type LanguageList = Language[];

const language = new ObservableNumber(0, { clientWritable: true })
const systemMessageMap = {
    "japanese": "日本語に設定しました。",
    "english": "Setting to English."
} as const;
const langList = Object.keys(systemMessageMap) as unknown as LanguageList;

export const SelectLanguage: ItemCustomComponent = {
    onUse({ source, itemStack }) {
        if (!itemStack) return;
        new CustomForm(source, "言語 / Language")
            .dropdown("選ぶ / choose", language, [
                { "label": "日本語", "value": 0 },
                { "label": "English", "value": 1 }
            ])
            .spacer()
            .closeButton()
            .show()
            .then(() => {
                const container = source.getComponent("minecraft:inventory")?.container;
                if (!container) return;

                const selectedLang = langList[language.getData()];
                if (selectedLang === undefined) return;

                const isFirst = !world.getDynamicProperty("cb2:already_set_lang");
                if (isFirst) {
                    world.setDynamicProperty("cb2:world_language", selectedLang);
                    world.setDynamicProperty("cb2:already_set_lang", true);
                }
                source.setDynamicProperty("cb2:player_language", selectedLang);
                container.setItem(source.selectedSlotIndex);
                source.playSound("random.orb");
                source.sendMessage(`§b[CB2]§r ${systemMessageMap[selectedLang]}`)
            })
            .catch(e => {
                console.error(e);
            });
    }
}

export const getWorldLanguage = (): string => {
    const fetched = world.getDynamicProperty("cb2:world_language");
    if (typeof fetched !== "string") return "english";
    return fetched;
}
export const getPlayerLanguage = (player: Player): string => {
    const fetched = player.getDynamicProperty("cb2:player_language");
    if (typeof fetched !== "string") return "english";
    return fetched;
}