import { Plugin, WorkspaceLeaf, debounce } from "obsidian";
import { DashboardView, VIEW_TYPE_DASHBOARD } from "./DashboardView";
import { WanderingParty } from "./mechanics/WanderingParty";
import { XpSystem } from "./mechanics/XpSystem";
import { ObsidianQuestSettingTab } from "./SettingsTab";
import { ObsidianQuestSettings, DEFAULT_SETTINGS, QuestPluginInterface } from "./types";

export default class ObsidianQuest extends Plugin implements QuestPluginInterface {
  settings: ObsidianQuestSettings;
  wanderingParty: WanderingParty;
  xpSystem: XpSystem;

  // デバウンスされた保存関数
  saveSettingsDebounced = debounce(async () => {
      await this.saveSettings();
  }, 1000, true);

  async onload() {
    await this.loadSettings();

    // レトロモードの適用
    this.updateRetroMode();

    // 1. メカニクスの初期化
    this.wanderingParty = new WanderingParty(this);
    
    // ★変更: 設定がONの時だけキャラクターを出現させる
    if (this.settings.enableWanderingParty) {
        this.wanderingParty.load();
    }

    this.xpSystem = new XpSystem(this);
    this.xpSystem.setup(this.app.workspace);

    // 2. ビューの登録
    this.registerView(
      VIEW_TYPE_DASHBOARD,
      (leaf) => new DashboardView(leaf, this)
    );

    // 3. 設定タブの登録
    this.addSettingTab(new ObsidianQuestSettingTab(this.app, this));

    // 4. リボンアイコン
    this.addRibbonIcon("sword", "冒険の書を開く", () => {
      this.activateView();
    });
  }

  onunload() {
      if (this.wanderingParty) {
          this.wanderingParty.unload();
      }
      document.body.removeClass("quest-retro-mode");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // 見た目の更新
    this.updateRetroMode();
    // ★追加: キャラクター表示状態の更新
    this.updateWanderingPartyState();
  }

  updateRetroMode() {
    if (this.settings.enableRetroMode) {
      document.body.addClass("quest-retro-mode");
    } else {
      document.body.removeClass("quest-retro-mode");
    }
  }

  // ★追加: 設定に合わせてキャラを出し入れする機能
  updateWanderingPartyState() {
    if (this.settings.enableWanderingParty) {
        // ONなのにまだロードされていなければロード（二重ロード防止はWanderingParty側で制御してない場合はここでunloadしてからloadすると安全）
        this.wanderingParty.unload(); // 一旦消して
        this.wanderingParty.load();   // 再生成（リロード代わりにもなる）
    } else {
        // OFFなら消す
        this.wanderingParty.unload();
    }
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
    }

    if (leaf) workspace.revealLeaf(leaf);
  }
}
