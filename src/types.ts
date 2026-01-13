import { Plugin } from "obsidian";

// ... (Character, Shortcut の定義はそのまま) ...
export interface Character {
  id: string;
  name: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  imageSeed: string;
  customImage?: string;
}

export interface Shortcut {
  label: string;
  url: string;
}

export interface ObsidianQuestSettings {
  party: {
    hero: Character;
    playboy: Character;
    scholar: Character;
    hunter: Character;
  };
  wanderingInterval: number;
  wanderingDistance: number;
  shortcuts: Shortcut[];
  enableRetroMode: boolean;
  enableWanderingParty: boolean; // ★追加: キャラクター表示のオンオフ
}

export const DEFAULT_SETTINGS: ObsidianQuestSettings = {
  party: {
    hero: { id: "hero", name: "勇者", level: 1, currentXp: 0, nextLevelXp: 100, imageSeed: "Mochi" },
    playboy: { id: "playboy", name: "遊び人", level: 1, currentXp: 0, nextLevelXp: 100, imageSeed: "Coco" },
    scholar: { id: "scholar", name: "賢者", level: 1, currentXp: 0, nextLevelXp: 100, imageSeed: "Vanilla" },
    hunter: { id: "hunter", name: "狩人", level: 1, currentXp: 0, nextLevelXp: 100, imageSeed: "Choco" },
  },
  wanderingInterval: 5,
  wanderingDistance: 0,
  shortcuts: [
    { label: "Google", url: "https://google.com" },
    { label: "GitHub", url: "https://github.com" },
    { label: "YouTube", url: "https://youtube.com" },
    { label: "ChatGPT", url: "https://chat.openai.com" },
  ],
  enableRetroMode: true,
  enableWanderingParty: true, // ★追加: デフォルトはON
};

// ... (QuestPluginInterface はそのまま) ...
export interface QuestPluginInterface extends Plugin {
    settings: ObsidianQuestSettings;
    saveSettings: () => Promise<void>;
    wanderingParty: any;
    xpSystem: any;
}
