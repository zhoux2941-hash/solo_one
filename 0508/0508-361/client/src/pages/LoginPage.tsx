import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string; role: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('登录成功');
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        switch (user.role) {
          case 'author':
            navigate('/author');
            break;
          case 'reviewer':
            navigate('/reviewer');
            break;
          case 'chair':
            navigate('/chair');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" variant="borderless">
        <h1 className="auth-title">学术会议投稿系统</h1>
        <p className="auth-subtitle">欢迎回来，请登录您的账号</p>

        <Form
          name="login"
          initialValues={{ role: 'author' }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '44px', fontSize: '16px' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ color: '#666' }}>还没有账号？</span>{' '}
          <Link to="/register" style={{ color: '#667eea' }}>
            立即注册
          </Link>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>测试账号：</div>
          <div>主席: chair@conference.com / chair123</div>
          <div>审稿人: reviewer1@conference.com / reviewer123</div>
          <div>作者: author1@conference.com / author123</div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
