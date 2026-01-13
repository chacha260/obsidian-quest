import * as React from "react";

interface WindowFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actionButton?: React.ReactNode; // 右上の「＋」ボタンなど用
}

export const WindowFrame = ({ title, children, className = "", actionButton }: WindowFrameProps) => {
  return (
    <div 
      className={`quest-window ${className}`}
      style={{
        border: '4px double #ffffff',     /* 白の二重線 */
        backgroundColor: 'rgba(0, 0, 34, 0.85)', /* 濃紺の半透明背景 */
        borderRadius: '4px',
        padding: '12px',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        color: '#fff'
      }}
    >
      {/* タイトルバー */}
      {title && (
        <div style={{
            borderBottom: '2px solid #fff',
            marginBottom: '10px',
            paddingBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '1.1em',
            fontWeight: 'bold'
        }}>
            <span>{title}</span>
            {actionButton && <span>{actionButton}</span>}
        </div>
      )}

      {/* コンテンツ領域 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};