import { useState, useEffect } from 'react'
import { Layout, Menu, Select, Typography, ConfigProvider } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  BookOutlined,
  TrendingUpOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'
import Dashboard from './pages/Dashboard'
import InterestEvolution from './pages/InterestEvolution'
import ReadingBreadth from './pages/ReadingBreadth'
import Recommendations from './pages/Recommendations'
import TrendingTags from './pages/TrendingTags'
import CompletionAnalysis from './pages/CompletionAnalysis'
import { readerApi } from './services/api'
import type { Reader } from './types'

const { Header, Content, Sider } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>['items'][number]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [readers, setReaders] = useState<Reader[]>([])
  const [selectedReaderId, setSelectedReaderId] = useState<number | null>(null)

  useEffect(() => {
    loadReaders()
  }, [])

  const loadReaders = async () => {
    try {
      const response = await readerApi.list()
      const data = response.data.data
      setReaders(data)
      if (data.length > 0 && !selectedReaderId) {
        setSelectedReaderId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load readers:', error)
    }
  }

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页概览',
      onClick: () => navigate('/'),
    },
    {
      key: '/interest-evolution',
      icon: <BarChartOutlined />,
      label: '兴趣演化',
      onClick: () => navigate('/interest-evolution'),
    },
    {
      key: '/reading-breadth',
      icon: <BarChartOutlined />,
      label: '阅读广度',
      onClick: () => navigate('/reading-breadth'),
    },
    {
      key: '/completion',
      icon: <CheckCircleOutlined />,
      label: '完本率分析',
      onClick: () => navigate('/completion'),
    },
    {
      key: '/trending-tags',
      icon: <TrendingUpOutlined />,
      label: '群体趋势',
      onClick: () => navigate('/trending-tags'),
    },
    {
      key: '/recommendations',
      icon: <BookOutlined />,
      label: '智能推荐',
      onClick: () => navigate('/recommendations'),
    },
  ]

  const selectedMenuKey = location.pathname === '/' ? '/' : location.pathname

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
          <Title level={3} style={{ color: 'white', margin: 0, marginRight: 40 }}>
            图书馆智能荐书系统
          </Title>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'white', marginRight: 12 }}>选择读者：</span>
            <Select
              style={{ width: 200 }}
              value={selectedReaderId}
              onChange={(value) => setSelectedReaderId(value)}
              options={readers.map((r) => ({
                label: r.name,
                value: r.id,
              }))}
              placeholder="请选择读者"
            />
          </div>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedMenuKey]}
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content
              style={{
                background: '#fff',
                padding: 24,
                margin: 0,
                minHeight: 280,
                borderRadius: 8,
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard readerId={selectedReaderId} />}
                />
                <Route
                  path="/interest-evolution"
                  element={<InterestEvolution readerId={selectedReaderId} />}
                />
                <Route
                  path="/reading-breadth"
                  element={<ReadingBreadth readerId={selectedReaderId} />}
                />
                <Route
                  path="/completion"
                  element={<CompletionAnalysis readerId={selectedReaderId} />}
                />
                <Route path="/trending-tags" element={<TrendingTags />} />
                <Route
                  path="/recommendations"
                  element={<Recommendations readerId={selectedReaderId} />}
                />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default App
