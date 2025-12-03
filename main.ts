import { Plugin, Editor, MarkdownView, Notice, Modal, App, PluginSettingTab, Setting } from "obsidian";

// ------------------------------------------------------------
// 1. データ構造
// ------------------------------------------------------------

interface Character {
  id: string; // 識別ID
  name: string; // 名前
  level: number; // レベル
  currentXp: number; // 現在のXP
  nextLevelXp: number; // 次のレベルに必要なXP
  imageSeed: string; // ドット絵生成用のシード値
  customImage?: string; // カスタム画像のパスまたはData URI
}

interface ObsidianQuestSettings {
  party: {
    hero: Character;
    playboy: Character;
    scholar: Character;
    hunter: Character;
  };
    wanderingInterval: number; // 秒単位
    wanderingDistance: number; // ピクセル単位 (0ならランダム)
}

const DEFAULT_SETTINGS: ObsidianQuestSettings = {
  party: {
    hero: {
      id: "hero",
      name: "勇者",
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      imageSeed: "Mochi", // Cuter seed
    },
    playboy: {
      id: "playboy",
      name: "遊び人",
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      imageSeed: "Coco", // Cuter seed
    },
    scholar: {
      id: "scholar",
      name: "賢者",
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      imageSeed: "Vanilla", // Cuter seed
    },
    hunter: {
      id: "hunter",
      name: "狩人",
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      imageSeed: "Choco", // Cuter seed
    },
  },
    wanderingInterval: 5,
    wanderingDistance: 0,
};

// ------------------------------------------------------------
// 2. ステータス画面（モーダル）クラス
// ------------------------------------------------------------
class StatusModal extends Modal {
  plugin: ObsidianQuest;

  constructor(app: App, plugin: ObsidianQuest) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    const party = this.plugin.settings.party;

    contentEl.createEl("h2", { text: "⚔️ 冒険の記録" });

    // グリッドコンテナを作成
    const container = contentEl.createDiv({ cls: "quest-status-container" });

    // 各キャラのカードを作成
    // Object.valuesを使って全員分ループ
    Object.values(party).forEach((char) => {
      this.createCharacterCard(container, char);
    });
  }

  createCharacterCard(container: HTMLElement, char: Character) {
    const card = container.createDiv({ cls: "quest-char-card" });

    // 左側：ドット絵画像
    // カスタム画像があればそれを優先、なければDiceBear API
    let imgUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${char.imageSeed}`;
    if (char.customImage) {
        imgUrl = char.customImage;
    }

    card.createEl("img", { 
        attr: { src: imgUrl }, 
        cls: "quest-char-img" 
    });

    // 右側：ステータス情報
    const info = card.createDiv({ cls: "quest-char-info" });
    info.createEl("h3", { text: `${char.name} (Lv.${char.level})` });
    info.createDiv({ text: `XP: ${char.currentXp} / ${char.nextLevelXp}` });

    // XPバー
    const barBg = info.createDiv({ cls: "quest-xp-bar-bg" });
    const progress = (char.currentXp / char.nextLevelXp) * 100;
    barBg.createDiv({
      cls: "quest-xp-bar-fill",
      attr: { style: `width: ${progress}%` },
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// ------------------------------------------------------------
// 3. プラグイン本体
// ------------------------------------------------------------

export default class ObsidianQuest extends Plugin {
  settings: ObsidianQuestSettings;
  lastLength: number = 0;
  lastLinkCount: number = 0;
  lastTaskCount: number = 0;
  wanderingParty: WanderingParty;

  async onload() {
    await this.loadSettings();

        // Wandering Party init
        this.wanderingParty = new WanderingParty(this);
        this.wanderingParty.load();

        // Settings Tab
        this.addSettingTab(new ObsidianQuestSettingTab(this.app, this));

    // ★リボンアイコンの追加 (左側のサイドバー)
    // アイコン名 "sword" はObsidianのLucideアイコンセットから
    this.addRibbonIcon("sword", "冒険のステータスを開く", (evt: MouseEvent) => {
      new StatusModal(this.app, this).open();
    });

    // 監視1: ファイル切替時
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof MarkdownView) {
          this.updateCurrentStats(leaf.view.editor);
        }
      })
    );

    // 監視2: 文字入力時
    this.registerEvent(
      this.app.workspace.on(
        "editor-change",
        (editor: Editor, view: MarkdownView) => {
          this.handleEditorChange(editor);
        }
      )
    );
  }

    onunload() {
        if (this.wanderingParty) {
            this.wanderingParty.unload();
        }
    }
  updateCurrentStats(editor: Editor) {
    const text = editor.getValue();
    this.lastLength = text.length;
    this.lastLinkCount = (text.match(/\[\[.*?\]\]/g) || []).length;
    this.lastTaskCount = (text.match(/- \[x\]/g) || []).length;
  }

  async handleEditorChange(editor: Editor) {
    const text = editor.getValue();
    const currentLength = text.length;
    const currentLinkCount = (text.match(/\[\[.*?\]\]/g) || []).length;
    const currentTaskCount = (text.match(/- \[x\]/g) || []).length;

    const lengthDiff = currentLength - this.lastLength;
    const linkDiff = currentLinkCount - this.lastLinkCount;
    const taskDiff = currentTaskCount - this.lastTaskCount;

    // 1. 勇者 & 遊び人 (文字数)
    if (lengthDiff > 0) {
      if (lengthDiff === 1) {
        // 勇者 (1文字入力)
        this.gainXp("hero", 1);
      } else {
        // 遊び人 (コピペ)
        this.gainXp("playboy", lengthDiff);
      }
    }

    // 2. 賢者 (リンク作成)
    if (linkDiff > 0) {
      // リンク1つにつき10XP (仮)
      this.gainXp("scholar", linkDiff * 10);
      new Notice(`📖 賢者が知識を繋げた！ (+${linkDiff * 10} XP)`);
    }

    // 3. 狩人 (タスク完了)
    if (taskDiff > 0) {
      // タスク1つにつき20XP (仮)
      this.gainXp("hunter", taskDiff * 20);
      new Notice(`🏹 狩人がタスクを仕留めた！ (+${taskDiff * 20} XP)`);
    }

    this.lastLength = currentLength;
    this.lastLinkCount = currentLinkCount;
    this.lastTaskCount = currentTaskCount;
  }

    async gainXp(charKey: keyof ObsidianQuestSettings['party'], amount: number) {
        const char = this.settings.party[charKey];
        char.currentXp += amount;

        // レベルアップ判定
        if (char.currentXp >= char.nextLevelXp) {
            char.level += 1;
            char.currentXp = char.currentXp - char.nextLevelXp;
            char.nextLevelXp = Math.floor(char.nextLevelXp * 1.5);
            
            new Notice(`🎉 ${char.name}がレベルアップ！ Lv.${char.level}！`);
        }

        await this.saveSettings();
        // モーダルが開いていれば更新したいが、今回は簡易実装のため保存のみ
    }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ------------------------------------------------------------
// 4. Wandering Party (デスクトップマスコット)
// ------------------------------------------------------------
class WanderingParty {
    plugin: ObsidianQuest;
    elements: HTMLElement[] = [];
    intervalId: number | null = null;
    isDragging: boolean = false;
    draggedEl: HTMLElement | null = null;
    offsetX: number = 0;
    offsetY: number = 0;

    constructor(plugin: ObsidianQuest) {
        this.plugin = plugin;
    }

    load() {
        const party = this.plugin.settings.party;
        Object.values(party).forEach(char => {
            this.createWanderer(char);
        });

        this.startInterval();
        
        // 初回移動
        this.moveWanderers();

        // グローバルなマウスイベント (ドラッグ用)
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
    }

    unload() {
        this.stopInterval();
        this.elements.forEach(el => el.remove());
        this.elements = [];

        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    }

    reload() {
        this.stopInterval();
        this.startInterval();
    }

    startInterval() {
        const intervalSec = this.plugin.settings.wanderingInterval || 5;
        this.intervalId = window.setInterval(() => {
            if (!this.isDragging) {
                this.moveWanderers();
            }
        }, intervalSec * 1000);
    }

    stopInterval() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    createWanderer(char: Character) {
        let imgUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${char.imageSeed}`;
        if (char.customImage) {
            imgUrl = char.customImage;
        }

        const img = document.body.createEl("img", {
            cls: "quest-wanderer",
            attr: { src: imgUrl }
        });
        
        // 初期位置
        img.style.top = "-100px";
        img.style.left = "-100px";

        // イベントリスナー
        img.addEventListener("mousedown", (e) => this.onMouseDown(e, img));
        img.addEventListener("click", (e) => this.onClick(e, img, char));

        this.elements.push(img);
    }

    moveWanderers() {
        const maxDist = this.plugin.settings.wanderingDistance;

        this.elements.forEach(el => {
            // ドラッグ中の要素は勝手に動かさない
            if (el === this.draggedEl) return;

            let x, y;

            if (maxDist > 0) {
                // 現在位置から maxDist 以内のランダムな位置へ
                const rect = el.getBoundingClientRect();
                const currentX = rect.left;
                const currentY = rect.top;

                // -maxDist ~ +maxDist の範囲で移動
                const dx = (Math.random() - 0.5) * 2 * maxDist;
                const dy = (Math.random() - 0.5) * 2 * maxDist;

                x = Math.max(0, Math.min(window.innerWidth - 60, currentX + dx));
                y = Math.max(0, Math.min(window.innerHeight - 60, currentY + dy));
            } else {
                // 画面内のランダムな位置へ (距離制限なし)
                x = Math.random() * (window.innerWidth - 60);
                y = Math.random() * (window.innerHeight - 60);
            }
            
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            // たまに反転させる (右向き/左向き)
            if (Math.random() > 0.5) {
                el.style.transform = "scaleX(-1)";
            } else {
                el.style.transform = "scaleX(1)";
            }
        });
    }

    // --- Interaction Handlers ---

    onMouseDown = (e: MouseEvent, el: HTMLElement) => {
        e.preventDefault();
        this.isDragging = true;
        this.draggedEl = el;
        
        // クリック位置と要素の左上とのズレを計算
        const rect = el.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        // transitionを一時的に無効化 (CSSで :active に設定済みだが念のため)
        el.style.transition = "none";
    }

    onMouseMove = (e: MouseEvent) => {
        if (!this.isDragging || !this.draggedEl) return;
        e.preventDefault();

        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;

        this.draggedEl.style.left = `${x}px`;
        this.draggedEl.style.top = `${y}px`;
    }

    onMouseUp = () => {
        if (this.isDragging && this.draggedEl) {
            // transitionを戻す
            this.draggedEl.style.transition = "top 3s ease-in-out, left 3s ease-in-out";
        }
        this.isDragging = false;
        this.draggedEl = null;
    }

    onClick = (e: MouseEvent, el: HTMLElement, char: Character) => {
        // ドラッグ終了時のクリックイベント発火を防ぐための簡易判定
        // (厳密にはmousedown位置と比較すべきだが、ここでは簡易的に)
        if (this.isDragging) return;

        // ジャンプアニメーション
        el.removeClass("quest-jump");
        void el.offsetWidth; // リフロー強制
        el.addClass("quest-jump");

        new Notice(`${char.name}: "冒険は順調？"`);
    }
}
// ------------------------------------------------------------
// 5. 設定画面
// ------------------------------------------------------------
class ObsidianQuestSettingTab extends PluginSettingTab {
    plugin: ObsidianQuest;

    constructor(app: App, plugin: ObsidianQuest) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Obsidian Quest Settings' });

        new Setting(containerEl)
            .setName('Wandering Interval (seconds)')
            .setDesc('How often the party moves around the screen.')
            .addText(text => text
                .setPlaceholder('5')
                .setValue(String(this.plugin.settings.wanderingInterval))
                .onChange(async (value) => {
                    const num = Number(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.wanderingInterval = num;
                        await this.plugin.saveSettings();
                        // Reload wandering party to apply changes
                        this.plugin.wanderingParty.reload();
                    }
                }));

        new Setting(containerEl)
            .setName('Wandering Distance (pixels)')
            .setDesc('Max distance for each move. Set 0 for random screen-wide movement.')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(String(this.plugin.settings.wanderingDistance))
                .onChange(async (value) => {
                    const num = Number(value);
                    if (!isNaN(num) && num >= 0) {
                        this.plugin.settings.wanderingDistance = num;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}
