import React, { useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, message } from 'antd';
import {
  HomeOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { authApi } from '../services/api';

const { Header, Content, Sider } = AntLayout;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi.getCurrentUser().then(response => {
        if (response.data.success) {
          setUser(response.data.data);
        }
      }).catch(() => {
        logout();
        navigate('/login');
      });
    }
  }, [isAuthenticated, user, setUser, logout, navigate]);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '发现音乐',
      onClick: () => navigate('/'),
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: '上传音乐',
      onClick: () => navigate('/upload'),
    },
    {
      key: '/playlists',
      icon: <UnorderedListOutlined />,
      label: '我的歌单',
      onClick: () => navigate('/playlists'),
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '播放历史',
      onClick: () => navigate('/history'),
    },
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({
      key: '/admin',
      icon: <SafetyOutlined />,
      label: '后台审核',
      onClick: () => navigate('/admin'),
    });
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人主页',
      onClick: () => navigate(`/user/${user?.id}`),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/')}>
          🎵 音乐分享平台
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} src={user?.avatar} />
            <span>{user?.nickname || user?.username}</span>
          </div>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }} className="page-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
