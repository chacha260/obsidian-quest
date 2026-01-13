import * as React from "react";
import { QuestPluginInterface } from "../types";

interface CommandListProps {
    plugin: QuestPluginInterface;
}

export const CommandList = ({ plugin }: CommandListProps) => {
    // 任意の静的コマンドリスト（必要に応じて設定から読み込むよう改造も可能）
    const commands = [
        { label: '日報・週報', path: 'Daily/2024-12-25' }, 
        { label: 'プロジェクト管理', path: 'Projects/ActiveParams' },
        { label: '開発メモ', path: 'Dev/ReactLearning' },
    ];

    const openLink = (path: string) => {
        plugin.app.workspace.openLinkText(path, "", false);
    };

    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            {commands.map(cmd => (
                <li 
                    key={cmd.label} 
                    onClick={() => openLink(cmd.path)}
                    className="quest-command-item" 
                    style={{ 
                        cursor: 'pointer', 
                        borderBottom: '1px dashed #444',
                        transition: 'all 0.2s',
                        color: '#eee'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffcc00'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#eee'}
                >
                    ➤ {cmd.label}
                </li>
            ))}
        </ul>
    );
};