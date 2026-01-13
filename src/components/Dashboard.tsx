import * as React from "react";
import { WindowFrame } from "./WindowFrame";
import { PartyVisuals } from "./PartyVisuals";
import { CommandList } from "./CommandList";
import { StatusWindow } from "./StatusWindow";
import { InformationBoard } from "./InformationBoard";
import { QuestPluginInterface, Shortcut } from "../types";

interface DashboardProps {
  plugin: QuestPluginInterface;
}

export const Dashboard = ({ plugin }: DashboardProps) => {
  const party = plugin.settings.party;
  const shortcuts = plugin.settings.shortcuts;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr 250px', 
      gridTemplateRows: 'auto 1fr',          
      gap: '16px',
      height: '100%',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      {/* ---------------- 左カラム ---------------- */}
      <div style={{ gridRow: '1 / span 2' }}>
        <WindowFrame title="ルーラの記録">
          <CommandList plugin={plugin} />
        </WindowFrame>
      </div>

      {/* ---------------- 中央上: パーティ ---------------- */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
         <PartyVisuals party={party} />
      </div>

      {/* ---------------- 中央メイン: 酒場の情報板 ---------------- */}
      <div style={{ minHeight: 0 }}>
        <WindowFrame title="酒場の情報板">
           <p style={{ margin: '0 0 10px 0', color: '#ffcc00' }}>直近の冒険記録</p>
           <div style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
               <InformationBoard plugin={plugin} />
           </div>
        </WindowFrame>
      </div>

      {/* ---------------- 右カラム ---------------- */}
      <div style={{ gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 旅の扉 */}
        <div style={{ height: '200px' }}>
            <WindowFrame title="旅の扉">
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '8px', 
                    overflowY: 'auto', 
                    maxHeight: '100%' 
                }}>
                    {shortcuts.map((site: Shortcut, index: number) => (
                        <ShortcutButton key={index} label={site.label} url={site.url} />
                    ))}
                    {shortcuts.length === 0 && (
                        <div style={{gridColumn: 'span 2', textAlign: 'center', color: '#888'}}>
                            設定からサイトを追加
                        </div>
                    )}
                </div>
            </WindowFrame>
        </div>

        {/* ステータス */}
        <div style={{ flex: 1 }}>
            <WindowFrame title="ステータス">
                <StatusWindow party={party} />
            </WindowFrame>
        </div>
      </div>

    </div>
  );
};

const ShortcutButton = ({ label, url }: { label: string, url: string }) => (
    <button 
        onClick={() => window.open(url, '_blank')}
        style={{ 
            background: '#222', 
            border: '2px solid #fff', 
            color: '#fff', 
            padding: '10px', 
            cursor: 'pointer', 
            fontFamily: 'inherit',
            fontSize: '0.9em'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#444'; e.currentTarget.style.borderColor = '#ffcc00'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#222'; e.currentTarget.style.borderColor = '#fff'; }}
    >
        {label}
    </button>
);