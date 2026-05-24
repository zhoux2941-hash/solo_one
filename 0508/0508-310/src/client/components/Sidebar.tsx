import type { SSHConnection } from '../types';

interface SidebarProps {
  connections: SSHConnection[];
  onSelectConnection: (connection: SSHConnection) => void;
  onEditConnection: (connection: SSHConnection) => void;
  onDeleteConnection: (id: string) => void;
  onNewConnection: () => void;
}

export function Sidebar({ 
  connections, 
  onSelectConnection, 
  onEditConnection, 
  onDeleteConnection,
  onNewConnection 
}: SidebarProps) {
  const sortedConnections = [...connections].sort((a, b) => {
    const aUsed = a.lastUsed || 0;
    const bUsed = b.lastUsed || 0;
    return bUsed - aUsed;
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>服务器连接</h3>
        <button onClick={onNewConnection} style={addButtonStyle}>
          + 新建
        </button>
      </div>
      
      <div style={listStyle}>
        {sortedConnections.length === 0 ? (
          <div style={emptyStyle}>
            暂无保存的连接
          </div>
        ) : (
          sortedConnections.map((connection) => (
            <div key={connection.id} style={itemStyle}>
              <div 
                style={itemContentStyle}
                onClick={() => onSelectConnection(connection)}
              >
                <div style={itemNameStyle}>{connection.name}</div>
                <div style={itemDetailsStyle}>
                  {connection.username}@{connection.host}:{connection.port}
                </div>
              </div>
              <div style={itemActionsStyle}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditConnection(connection);
                  }}
                  style={actionButtonStyle}
                  title="编辑"
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConnection(connection.id);
                  }}
                  style={{ ...actionButtonStyle, ...deleteButtonStyle }}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%'
};

const headerStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #1e1e1e',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#cccccc',
  fontSize: '14px',
  fontWeight: 600
};

const addButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#0e639c',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  cursor: 'pointer'
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px'
};

const emptyStyle: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
  color: '#666666',
  fontSize: '13px'
};

const itemStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#2d2d2d',
  borderRadius: '4px',
  marginBottom: '8px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  ':hover': {
    backgroundColor: '#3c3c3c'
  }
};

const itemContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const itemNameStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '2px'
};

const itemDetailsStyle: React.CSSProperties = {
  color: '#858585',
  fontSize: '11px'
};

const itemActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginLeft: '8px'
};

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  padding: '4px',
  borderRadius: '2px',
  ':hover': {
    backgroundColor: '#3c3c3c'
  }
};

const deleteButtonStyle: React.CSSProperties = {
  ':hover': {
    backgroundColor: '#cd3131'
  }
};
