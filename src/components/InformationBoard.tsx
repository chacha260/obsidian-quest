import * as React from "react";
import { TFile } from "obsidian";
import { QuestPluginInterface } from "../types";

interface InformationBoardProps {
    plugin: QuestPluginInterface;
}

export const InformationBoard = ({ plugin }: InformationBoardProps) => {
    const [recentFiles, setRecentFiles] = React.useState<TFile[]>([]);

    const refreshFiles = () => {
        const files = plugin.app.vault.getMarkdownFiles();
        const sorted = files.sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 10);
        setRecentFiles(sorted);
    };

    React.useEffect(() => {
        refreshFiles();
        // 重くなるのを避けるため、一旦自動更新はOFFにしておきます（必要なら以下を有効化）
        // const eventRef = plugin.app.vault.on("modify", refreshFiles);
        // return () => { plugin.app.vault.offref(eventRef); };
    }, []);

    const openFile = (file: TFile) => {
        plugin.app.workspace.getLeaf(false).openFile(file);
    };

    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9em' }}>
            {recentFiles.map(file => (
                <li 
                    key={file.path} 
                    onClick={() => openFile(file)}
                    style={{ 
                        cursor: 'pointer', 
                        padding: '4px 0', 
                        borderBottom: '1px dashed rgba(255,255,255,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                        {file.basename}
                    </span>
                    <span style={{ color: '#aaa', fontSize: '0.8em', minWidth: '80px', textAlign: 'right' }}>
                        {new Date(file.stat.mtime).toLocaleDateString()}
                    </span>
                </li>
            ))}
            {recentFiles.length === 0 && <li style={{ color: '#888' }}>冒険の記録なし</li>}
        </ul>
    );
};