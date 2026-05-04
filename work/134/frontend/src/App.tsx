import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  UploadOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LogUpload from './pages/LogUpload'
import LogSearch from './pages/LogSearch'
import ParseRules from './pages/ParseRules'
import './App.css'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '统计面板'
  },
  {
    key: '/upload',
    icon: <UploadOutlined />,
    label: '日志上传'
  },
  {
    key: '/search',
    icon: <FileTextOutlined />,
    label: '日志查询'
  },
  {
    key: '/rules',
    icon: <SettingOutlined />,
    label: '解析规则'
  }
]

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="logo" style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? '日志' : '日志分析系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', fontSize: 18, fontWeight: 'bold' }}>
            企业级日志分析系统
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<LogUpload />} />
            <Route path="/search" element={<LogSearch />} />
            <Route path="/rules" element={<ParseRules />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
