import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslation } from 'react-i18next'
import api from '@/api/axios'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { t } = useTranslation()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', values)
      login(response.data)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        title={<h2 style={{ textAlign: 'center', margin: 0 }}>企业级订单管理系统</h2>}
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('username')} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('login')}
            </Button>
          </Form.Item>
        </Form>
        <p style={{ textAlign: 'center', color: '#999', fontSize: 12, margin: 0 }}>
          默认账号: admin / admin123
        </p>
      </Card>
    </div>
  )
}

export default Login
