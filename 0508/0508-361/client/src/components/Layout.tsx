import React, { ReactNode } from 'react';
import { Button, Dropdown, Avatar, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { roleText } from '../types';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人资料',
      onClick: () => {
        if (user?.role === 'reviewer') {
          navigate('/reviewer?tab=profile');
        } else if (user?.role === 'author') {
          navigate('/author?tab=profile');
        }
      }
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="app-header">
        <div className="app-logo">
          <Badge color="#52c41a" />
          <span>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <>
              <span style={{ color: 'white', fontSize: '14px' }}>
                {roleText[user.role]}：{user.name}
              </span>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Avatar size="small" icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.3)' }} />
                  <span>{user.name}</span>
                </Button>
              </Dropdown>
            </>
          )}
        </div>
      </header>
      <main className="app-content">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
