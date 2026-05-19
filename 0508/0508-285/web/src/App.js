import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  AppstoreOutlined,
  HistoryOutlined,
  RocketOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ConfigList from './components/ConfigList';
import ConfigForm from './components/ConfigForm';
import VersionList from './components/VersionList';
import GrayRelease from './components/GrayRelease';
import 'antd/dist/reset.css';

const { Header, Sider, Content } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('configs');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const menuItems = [
    { key: 'configs', icon: <AppstoreOutlined />, label: '配置管理' },
    { key: 'versions', icon: <HistoryOutlined />, label: '版本历史' },
    { key: 'gray', icon: <RocketOutlined />, label: '灰度发布' },
    { key: 'audit', icon: <FileTextOutlined />, label: '审计日志' },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'configs':
        return (
          <ConfigList
            onEdit={(config) => {
              setEditingConfig(config);
              setShowForm(true);
            }}
            onCreate={() => {
              setEditingConfig(null);
              setShowForm(true);
            }}
          />
        );
      case 'versions':
        return <VersionList />;
      case 'gray':
        return <GrayRelease />;
      default:
        return <div>开发中...</div>;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            🚀 分布式配置中心
          </div>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => setSelectedKey(key)}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                background: '#fff',
                borderRadius: 8,
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </Layout>

      {showForm && (
        <ConfigForm
          visible={showForm}
          config={editingConfig}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}
    </ConfigProvider>
  );
}

export default App;
