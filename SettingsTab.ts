import { App, PluginSettingTab, Setting } from "obsidian";
import { QuestPluginInterface, Shortcut } from "./types";

export class ObsidianQuestSettingTab extends PluginSettingTab {
  plugin: QuestPluginInterface;

  constructor(app: App, plugin: QuestPluginInterface) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "冒険の書（設定）" });

    // --- 全画面レトロモード ---
    new Setting(containerEl)
        .setName("全画面レトロモード")
        .setDesc("ONにすると、Obsidian全体をドラクエ風の見た目に変更します。")
        .addToggle((toggle) => 
            toggle
                .setValue(this.plugin.settings.enableRetroMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableRetroMode = value;
                    await this.plugin.saveSettings();
                })
        );

    // --- Wandering Party ---
    new Setting(containerEl).setName("Wandering Party（キャラクター）").setHeading();

    // ★追加: キャラクター表示スイッチ
    new Setting(containerEl)
        .setName("キャラクターを表示する")
        .setDesc("画面内を歩き回る仲間たちの表示/非表示を切り替えます。")
        .addToggle((toggle) => 
            toggle
                .setValue(this.plugin.settings.enableWanderingParty)
                .onChange(async (value) => {
                    this.plugin.settings.enableWanderingParty = value;
                    await this.plugin.saveSettings(); // main.tsのupdateWanderingPartyStateが呼ばれます
                })
        );

    new Setting(containerEl)
      .setName("移動頻度 (秒)")
      .addText((text) =>
        text
          .setPlaceholder("5")
          .setValue(String(this.plugin.settings.wanderingInterval))
          .onChange(async (value) => {
            const num = Number(value);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.wanderingInterval = num;
              await this.plugin.saveSettings();
            }
          })
      );

    // --- 旅の扉 ---
    new Setting(containerEl).setName("旅の扉（ショートカット）").setHeading();
    
    const shortcuts = this.plugin.settings.shortcuts;

    shortcuts.forEach((shortcut, index) => {
      new Setting(containerEl)
        .setClass("quest-setting-item")
        .addText((text) =>
          text
            .setPlaceholder("サイト名")
            .setValue(shortcut.label)
            .onChange(async (value) => {
              shortcut.label = value;
              await this.plugin.saveSettings();
            })
        )
        .addText((text) =>
          text
            .setPlaceholder("URL")
            .setValue(shortcut.url)
            .onChange(async (value) => {
              shortcut.url = value;
              await this.plugin.saveSettings();
            })
        )
        .addButton((btn) =>
          btn
            .setButtonText("削除")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.shortcuts.splice(index, 1);
              await this.plugin.saveSettings();
              this.display();
            })
        );
    });

    new Setting(containerEl)
        .addButton((btn) => 
            btn
                .setButtonText("＋ 新しい扉を追加")
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.shortcuts.push({ label: "New Site", url: "https://" });
                    await this.plugin.saveSettings();
                    this.display();
                })
        );
  }
}