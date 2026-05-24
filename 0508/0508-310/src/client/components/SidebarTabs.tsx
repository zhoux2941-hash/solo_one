import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CommandSnippets } from './CommandSnippets';
import type { SSHConnection } from '../types';

interface SidebarTabsProps {
  connections: SSHConnection[];
  onSelectConnection: (connection: SSHConnection) => void;
  onEditConnection: (connection: SSHConnection) => void;
  onDeleteConnection: (id: string) => void;
  onNewConnection: () => void;
  onExecuteCommand: (command: string) => void;
  connected: boolean;
}

type TabType = 'connections' | 'snippets';

export function SidebarTabs({
  connections,
  onSelectConnection,
  onEditConnection,
  onDeleteConnection,
  onNewConnection,
  onExecuteCommand,
  connected
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('snippets');

  return (
    <div style={containerStyle}>
      <div style={tabsHeaderStyle}>
        <button
          onClick={() => setActiveTab('connections')}
          style={{
            ...tabButtonStyle,
            ...(activeTab === 'connections' ? tabActiveStyle : {})
          }}
        >
          🔗 连接
        </button>
        <button
          onClick={() => setActiveTab('snippets')}
          style={{
            ...tabButtonStyle,
            ...(activeTab === 'snippets' ? tabActiveStyle : {})
          }}
        >
          📝 命令
        </button>
      </div>

      <div style={tabContentStyle}>
        {activeTab === 'connections' && (
          <Sidebar
            connections={connections}
            onSelectConnection={onSelectConnection}
            onEditConnection={onEditConnection}
            onDeleteConnection={onDeleteConnection}
            onNewConnection={onNewConnection}
          />
        )}
        {activeTab === 'snippets' && (
          <CommandSnippets
            onExecuteCommand={onExecuteCommand}
            connected={connected}
          />
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  width: '320px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#252526',
  borderRight: '1px solid #1e1e1e'
};

const tabsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #1e1e1e'
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  color: '#858585',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};

const tabActiveStyle: React.CSSProperties = {
  color: '#ffffff',
  borderBottom: '2px solid #0e639c',
  backgroundColor: '#2d2d2d'
};

const tabContentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex'
};
