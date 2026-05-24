import type { TerminalTab } from '../types';

interface TabsProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

export function Tabs({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: TabsProps) {
  return (
    <div style={containerStyle}>
      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            style={{
              ...tabStyle,
              ...(activeTabId === tab.id ? activeTabStyle : {})
            }}
          >
            <span style={tabTitleStyle}>{tab.title}</span>
            {tab.connected && (
              <span style={connectedIndicatorStyle}>●</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={onNewTab} style={addButtonStyle}>
          +
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#252526',
  borderBottom: '1px solid #1e1e1e',
  padding: '4px 4px 0 4px'
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  overflowX: 'auto'
};

const tabStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: '#2d2d2d',
  borderTopLeftRadius: '4px',
  borderTopRightRadius: '4px',
  cursor: 'pointer',
  minWidth: '120px',
  maxWidth: '200px'
};

const activeTabStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  borderBottom: '2px solid #0e639c'
};

const tabTitleStyle: React.CSSProperties = {
  color: '#cccccc',
  fontSize: '13px',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const connectedIndicatorStyle: React.CSSProperties = {
  color: '#0dbc79',
  fontSize: '10px'
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#858585',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '0 4px',
  lineHeight: 1,
  ':hover': {
    color: '#ffffff'
  }
};

const addButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#858585',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '8px 12px',
  ':hover': {
    color: '#ffffff'
  }
};
