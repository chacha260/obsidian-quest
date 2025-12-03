import { Plugin, Editor, MarkdownView, Notice, Modal, App } from 'obsidian';

// ------------------------------------------------------------
// 1. データ構造
// ------------------------------------------------------------

interface Character {
	id: string;          // 識別ID
	name: string;        // 名前
	level: number;       // レベル
	currentXp: number;   // 現在のXP
	nextLevelXp: number; // 次のレベルに必要なXP
    imageSeed: string;   // ドット絵生成用のシード値
}

interface ObsidianQuestSettings {
	party: {
		hero: Character;
		playboy: Character;
		scholar: Character;
		hunter: Character;
	};
}

const DEFAULT_SETTINGS: ObsidianQuestSettings = {
	party: {
		hero: {
			id: "hero", name: "勇者", level: 1, currentXp: 0, nextLevelXp: 100,
            imageSeed: "Felix" // 生成される顔のパターン
		},
		playboy: {
			id: "playboy", name: "遊び人", level: 1, currentXp: 0, nextLevelXp: 100,
            imageSeed: "Aneka"
		},
		scholar: {
			id: "scholar", name: "賢者", level: 1, currentXp: 0, nextLevelXp: 100,
            imageSeed: "Jude"
		},
		hunter: {
			id: "hunter", name: "狩人", level: 1, currentXp: 0, nextLevelXp: 100,
            imageSeed: "Mia"
		},
	}
}

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

        // 左側：ドット絵画像 (DiceBear APIを使用)
        // ローカル画像を使いたい場合はここを src: "app://local/..." などに変えます
        const imgUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${char.imageSeed}`;
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
            attr: { style: `width: ${progress}%` } 
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

	async onload() {
		await this.loadSettings();

        // ★リボンアイコンの追加 (左側のサイドバー)
        // アイコン名 "sword" はObsidianのLucideアイコンセットから
        this.addRibbonIcon('sword', '冒険のステータスを開く', (evt: MouseEvent) => {
            new StatusModal(this.app, this).open();
        });

        // 監視1: ファイル切替時
        this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
            if (leaf?.view instanceof MarkdownView) {
                this.lastLength = leaf.view.editor.getValue().length;
            }
        }));

        // 監視2: 文字入力時
		this.registerEvent(this.app.workspace.on('editor-change', (editor: Editor, view: MarkdownView) => {
            this.handleEditorChange(editor);
        }));
	}

    async handleEditorChange(editor: Editor) {
        const currentLength = editor.getValue().length;
        const diff = currentLength - this.lastLength;

        if (diff > 0) {
            if (diff === 1) {
                // 勇者 (1文字入力)
                this.gainXp('hero', 1);
            } else {
                // 遊び人 (コピペ)
                this.gainXp('playboy', diff); 
            }
        }
        this.lastLength = currentLength;
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