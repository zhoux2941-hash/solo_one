import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('登录失败');
    }
    setLoading(false);
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.register(values);
      if (response.data.success) {
        message.success('注册成功，请登录');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('注册失败');
    }
    setLoading(false);
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名/邮箱' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名/邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="nickname"
          >
            <Input
              placeholder="昵称（可选）"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🎵 音乐分享平台</h1>
          <p style={{ color: '#888' }}>发现更多好音乐</p>
        </div>
        <Tabs defaultActiveKey="login" items={tabItems} centered />
      </Card>
    </div>
  );
};

export default Login;
