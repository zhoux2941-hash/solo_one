import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BookOutlined, TagOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const { Option } = Select;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('author');
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    role: UserRole;
    affiliation?: string;
    researchKeywords?: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const researchKeywords = values.researchKeywords
        ? values.researchKeywords.split(',').map((k) => k.trim()).filter((k) => k)
        : undefined;

      await register({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
        affiliation: values.affiliation,
        researchKeywords
      });

      message.success('注册成功');
      switch (values.role) {
        case 'author':
          navigate('/author');
          break;
        case 'reviewer':
          navigate('/reviewer');
          break;
        case 'chair':
          navigate('/chair');
          break;
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" variant="borderless" style={{ maxWidth: '500px' }}>
        <h1 className="auth-title">学术会议投稿系统</h1>
        <p className="auth-subtitle">创建您的账号</p>

        <Form
          name="register"
          initialValues={{ role: 'author' }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

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
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="注册身份"
            rules={[{ required: true, message: '请选择身份' }]}
          >
            <Select onChange={(value: UserRole) => setRole(value)}>
              <Option value="author">作者</Option>
              <Option value="reviewer">审稿人</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="affiliation"
            label="所属单位"
            rules={[{ required: true, message: '请输入所属单位' }]}
          >
            <Input prefix={<BookOutlined />} placeholder="请输入学校/机构名称" />
          </Form.Item>

          {role === 'reviewer' && (
            <Form.Item
              name="researchKeywords"
              label="研究领域关键词"
              tooltip="请输入您的研究领域关键词，多个关键词用逗号分隔"
              rules={[{ required: true, message: '请输入研究领域关键词' }]}
            >
              <Input
                prefix={<TagOutlined />}
                placeholder="例如：机器学习, 深度学习, 计算机视觉"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '44px', fontSize: '16px' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ color: '#666' }}>已有账号？</span>{' '}
          <Link to="/login" style={{ color: '#667eea' }}>
            立即登录
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
