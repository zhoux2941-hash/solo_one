import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, theme } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShopOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useTranslation } from 'react-i18next'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { mode, toggleTheme } = useThemeStore()
  const { t } = useTranslation()
  const { token } = theme.useToken()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('dashboard') },
    { key: '/order', icon: <ShoppingOutlined />, label: t('order') },
    { key: '/product', icon: <ShopOutlined />, label: t('product') },
    { key: '/finance', icon: <DollarOutlined />, label: t('finance') },
    { key: '/system', icon: <SettingOutlined />, label: t('system') },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={mode}
        style={{
          background: mode === 'dark' ? '#001529' : token.colorBgContainer,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: mode === 'dark' ? '#fff' : token.colorText,
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'OMS' : '订单管理系统'}
        </div>
        <Menu
          theme={mode}
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
        >
          <div></div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
            />
            <Dropdown menu={{ items: userMenuItems }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.realName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
