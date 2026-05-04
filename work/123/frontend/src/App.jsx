import React, { useState, useEffect } from 'react';
import { Layout, message } from 'antd';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import MapView from './components/MapView';
import TimelineControl from './components/TimelineControl';
import LayerToggle from './components/LayerToggle';
import { healthCheck } from './services/api';
import useAppStore from './store/appStore';
import './index.css';

const { Content } = Layout;

function App() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const { addAlert, mode } = useAppStore();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await healthCheck();
        setIsBackendConnected(true);
        message.success('已连接到后端服务');
      } catch (error) {
        setIsBackendConnected(false);
        message.warning('无法连接到后端服务，将使用模拟模式');
        console.warn('Backend connection failed:', error);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout style={{ height: '100vh', width: '100vw' }}>
      <Layout>
        <Content style={{ position: 'relative' }}>
          <MapView />
          
          <Toolbar />
          
          {mode !== 'drawing' && <LayerToggle />}
          
          <TimelineControl />
          
          {mode === 'drawing' && (
            <div className="node-drawing-hint">
              点击地图添加节点，依次点击两个节点创建道路
            </div>
          )}
        </Content>
        
        <Sidebar />
      </Layout>
    </Layout>
  );
}

export default App;
