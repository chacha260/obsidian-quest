import { Notice } from "obsidian";
import type ObsidianQuest from "../main"; // メインクラスの型を参照
import type { Character } from "../types";

export class WanderingParty {
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
        this.unload();
        this.load();
    }

    startInterval() {
        const intervalSec = this.plugin.settings.wanderingInterval || 5;
        // window.setInterval を明示的に使用
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
        // 設定された画像があればそれを使う、なければDiceBear
        let imgUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${char.imageSeed}`;
        if (char.customImage) {
            imgUrl = char.customImage;
        }

        const img = document.body.createEl("img", {
            cls: "quest-wanderer",
            attr: { src: imgUrl }
        });
        
        // CSSクラスは styles.css で定義済み (quest-wanderer)
        
        // 初期位置（画面外からスタートしないように調整）
        img.style.top = "50%";
        img.style.left = "50%";

        img.addEventListener("mousedown", (e) => this.onMouseDown(e, img));
        img.addEventListener("click", (e) => this.onClick(e, img, char));

        this.elements.push(img);
    }

    moveWanderers() {
        const maxDist = this.plugin.settings.wanderingDistance;

        this.elements.forEach(el => {
            if (el === this.draggedEl) return;

            let x, y;
            if (maxDist > 0) {
                const rect = el.getBoundingClientRect();
                const currentX = rect.left;
                const currentY = rect.top;
                const dx = (Math.random() - 0.5) * 2 * maxDist;
                const dy = (Math.random() - 0.5) * 2 * maxDist;
                x = Math.max(0, Math.min(window.innerWidth - 60, currentX + dx));
                y = Math.max(0, Math.min(window.innerHeight - 60, currentY + dy));
            } else {
                x = Math.random() * (window.innerWidth - 60);
                y = Math.random() * (window.innerHeight - 60);
            }
            
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            // 向きの反転
            if (Math.random() > 0.5) {
                el.style.transform = "scaleX(-1)";
            } else {
                el.style.transform = "scaleX(1)";
            }
        });
    }

    // --- Events ---

    onMouseDown = (e: MouseEvent, el: HTMLElement) => {
        e.preventDefault();
        this.isDragging = true;
        this.draggedEl = el;
        const rect = el.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
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
            this.draggedEl.style.transition = "top 3s ease-in-out, left 3s ease-in-out";
        }
        this.isDragging = false;
        this.draggedEl = null;
    }

    onClick = (e: MouseEvent, el: HTMLElement, char: Character) => {
        if (this.isDragging) return;
        el.removeClass("quest-jump");
        void el.offsetWidth; 
        el.addClass("quest-jump");
        new Notice(`${char.name}: "冒険は順調？"`);
    }
}