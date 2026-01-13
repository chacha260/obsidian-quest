import { Editor, MarkdownView, Notice, Workspace } from "obsidian";
import type ObsidianQuest from "../main";

export class XpSystem {
    plugin: ObsidianQuest;
    lastLength: number = 0;
    lastLinkCount: number = 0;
    lastTaskCount: number = 0;

    constructor(plugin: ObsidianQuest) {
        this.plugin = plugin;
    }

    setup(workspace: Workspace) {
        // 1. ファイル切替時の初期化
        workspace.on("active-leaf-change", (leaf) => {
            if (leaf?.view instanceof MarkdownView) {
                this.updateBaseStats(leaf.view.editor);
            }
        });

        // 2. 入力時のXP計算
        workspace.on("editor-change", (editor: Editor, view: MarkdownView) => {
            this.handleEditorChange(editor);
        });
    }

    updateBaseStats(editor: Editor) {
        const text = editor.getValue();
        this.lastLength = text.length;
        this.lastLinkCount = (text.match(/\[\[.*?\]\]/g) || []).length;
        this.lastTaskCount = (text.match(/- \[x\]/g) || []).length;
    }

    async handleEditorChange(editor: Editor) {
        const text = editor.getValue();
        const currentLength = text.length;
        
        // 簡易的な差分計算
        const lengthDiff = currentLength - this.lastLength;
        
        // 正規表現は重いので、lengthDiffが大きく動いた時や、特定の文字入力時だけに絞るのが理想だが
        // いったんは以前のロジックを踏襲しつつ実装
        const currentLinkCount = (text.match(/\[\[.*?\]\]/g) || []).length;
        const currentTaskCount = (text.match(/- \[x\]/g) || []).length;

        const linkDiff = currentLinkCount - this.lastLinkCount;
        const taskDiff = currentTaskCount - this.lastTaskCount;

        let settingsChanged = false;

        // 1. 勇者 & 遊び人 (文字数)
        if (lengthDiff > 0) {
            if (lengthDiff === 1) {
                // タイピング
                await this.gainXp("hero", 1, false);
                settingsChanged = true;
            } else {
                // コピペ
                await this.gainXp("playboy", lengthDiff, false);
                settingsChanged = true;
            }
        }

        // 2. 賢者 (リンク)
        if (linkDiff > 0) {
            await this.gainXp("scholar", linkDiff * 10, false);
            new Notice(`📖 賢者が知識を繋げた！ (+${linkDiff * 10} XP)`);
            settingsChanged = true;
        }

        // 3. 狩人 (タスク)
        if (taskDiff > 0) {
            await this.gainXp("hunter", taskDiff * 20, false);
            new Notice(`🏹 狩人がタスクを仕留めた！ (+${taskDiff * 20} XP)`);
            settingsChanged = true;
        }

        // 状態更新
        this.lastLength = currentLength;
        this.lastLinkCount = currentLinkCount;
        this.lastTaskCount = currentTaskCount;

        // まとめて保存 (パフォーマンス対策: ここで saveSettings を呼ぶ)
        if (settingsChanged) {
            this.plugin.saveSettingsDebounced();
        }
    }

    async gainXp(charKey: "hero" | "playboy" | "scholar" | "hunter", amount: number, saveNow: boolean) {
        const char = this.plugin.settings.party[charKey];
        char.currentXp += amount;

        if (char.currentXp >= char.nextLevelXp) {
            char.level += 1;
            char.currentXp = char.currentXp - char.nextLevelXp;
            char.nextLevelXp = Math.floor(char.nextLevelXp * 1.5);
            new Notice(`🎉 ${char.name}がレベルアップ！ Lv.${char.level}！`);
        }

        if (saveNow) {
            await this.plugin.saveSettings();
        }
    }
}