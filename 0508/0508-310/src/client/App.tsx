import { useState, useEffect, useCallback } from 'react';
import { TerminalComponent } from './components/Terminal';
import { Tabs } from './components/Tabs';
import { SidebarTabs } from './components/SidebarTabs';
import { ConnectionDialog } from './components/ConnectionDialog';
import { transportService } from './services/transport';
import { saveConnection, getConnections, deleteConnection, updateLastUsed } from './utils/storage';
import { generateId } from './utils/crypto';
import type { SSHConnection, TerminalTab } from './types';

function App() {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editConnection, setEditConnection] = useState<SSHConnection | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    setConnections(getConnections());
    
    transportService.connect().catch(console.error);
    
    transportService.setOnConnect(() => {
      console.log('Transport connected');
    });
    
    transportService.setOnDisconnect(() => {
      console.log('Transport disconnected');
    });

    return () => {
      transportService.disconnect();
    };
  }, []);

  const handleConnect = useCallback((connection: SSHConnection) => {
    saveConnection(connection);
    setConnections(getConnections());
    updateLastUsed(connection.id);

    const tabId = generateId();
    const newTab: TerminalTab = {
      id: tabId,
      connectionId: connection.id,
      title: connection.name,
      connected: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);

    transportService.send({
      type: 'connect',
      config: {
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        privateKey: connection.privateKey
      }
    });

    const originalHandler = transportService['onMessage'];
    transportService.setOnMessage((message) => {
      if (message.type === 'connected' && message.sessionId) {
        setSessionId(message.sessionId);
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { ...tab, connected: true } : tab
        ));
      }
      originalHandler?.(message);
    });
  }, []);

  const handleSelectConnection = useCallback((connection: SSHConnection) => {
    handleConnect(connection);
    setIsDialogOpen(false);
  }, [handleConnect]);

  const handleNewTab = useCallback(() => {
    setEditConnection(null);
    setIsDialogOpen(true);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
        setSessionId(null);
      }
      return newTabs;
    });
    
    transportService.send({ type: 'disconnect' });
  }, [activeTabId]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleEditConnection = useCallback((connection: SSHConnection) => {
    setEditConnection(connection);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteConnection = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(id);
      setConnections(getConnections());
    }
  }, []);

  const handleNewConnection = useCallback(() => {
    setEditConnection(null);
    setIsDialogOpen(true);
  }, []);

  const handleExecuteCommand = useCallback((command: string) => {
    if (sessionId) {
      transportService.send({
        type: 'data',
        data: command
      });
    }
  }, [sessionId]);

  const isConnected = sessionId !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        if (document.activeElement?.closest('.xterm')) {
          return;
        }
      }
      
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          handleTabClose(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewTab, handleTabClose, activeTabId]);

  return (
    <div style={appStyle}>
      <SidebarTabs
        connections={connections}
        onSelectConnection={handleSelectConnection}
        onEditConnection={handleEditConnection}
        onDeleteConnection={handleDeleteConnection}
        onNewConnection={handleNewConnection}
        onExecuteCommand={handleExecuteCommand}
        connected={isConnected}
      />
      
      <div style={mainStyle}>
        <Tabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
        
        <div style={terminalContainerStyle}>
          {tabs.length === 0 ? (
            <div style={welcomeStyle}>
              <h1 style={welcomeTitleStyle}>WebSSH Client</h1>
              <p style={welcomeTextStyle}>
                点击 <strong>+ 新建</strong> 创建 SSH 连接
              </p>
              <p style={welcomeTextStyle}>
                或从侧边栏选择已保存的连接
              </p>
              <div style={shortcutsStyle}>
                <h3 style={shortcutsTitleStyle}>键盘快捷键</h3>
                <ul style={shortcutsListStyle}>
                  <li><kbd>Ctrl + T</kbd> - 新建标签页</li>
                  <li><kbd>Ctrl + W</kbd> - 关闭标签页</li>
                  <li><kbd>Ctrl + C</kbd> - 发送中断信号</li>
                  <li><kbd>Ctrl + Z</kbd> - 挂起进程</li>
                  <li><kbd>Ctrl + L</kbd> - 清屏</li>
                </ul>
              </div>
            </div>
          ) : (
            <TerminalComponent
              sessionId={sessionId}
            />
          )}
        </div>
      </div>

      <ConnectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConnect={handleConnect}
        editConnection={editConnection}
      />
    </div>
  );
}

const appStyle: React.CSSProperties = {
  display: 'flex',
  width: '100vw',
  height: '100vh',
  margin: 0,
  padding: 0,
  backgroundColor: '#1e1e1e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const terminalContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  backgroundColor: '#1e1e1e'
};

const welcomeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#d4d4d4',
  padding: '40px'
};

const welcomeTitleStyle: React.CSSProperties = {
  fontSize: '36px',
  marginBottom: '20px',
  color: '#ffffff'
};

const welcomeTextStyle: React.CSSProperties = {
  fontSize: '16px',
  margin: '8px 0',
  color: '#cccccc'
};

const shortcutsStyle: React.CSSProperties = {
  marginTop: '40px',
  padding: '24px',
  backgroundColor: '#252526',
  borderRadius: '8px'
};

const shortcutsTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  margin: '0 0 16px 0',
  color: '#ffffff'
};

const shortcutsListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

export default App;
