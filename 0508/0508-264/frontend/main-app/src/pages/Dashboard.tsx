import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Spin, theme } from 'antd'
import {
  ShoppingOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/api/axios'

interface DashboardStats {
  totalOrders: number
  totalAmount: number
  pendingApproval: number
  completed: number
}

const Dashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 1256,
    totalAmount: 1586900,
    pendingApproval: 23,
    completed: 1189,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const orderTrendOption = {
    title: { text: '订单趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '销售额'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: [{ type: 'value' }, { type: 'value' }],
    series: [
      {
        name: '订单数',
        type: 'line',
        data: [120, 190, 150, 220, 180, 250],
        smooth: true,
      },
      {
        name: '销售额',
        type: 'bar',
        yAxisIndex: 1,
        data: [150000, 220000, 180000, 280000, 210000, 320000],
      },
    ],
  }

  const categoryPieOption = {
    title: { text: '商品分类占比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '数码电子' },
          { value: 735, name: '服装鞋帽' },
          { value: 580, name: '食品饮料' },
          { value: 484, name: '家居用品' },
          { value: 300, name: '其他' },
        ],
      },
    ],
  }

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('total_orders')}
              value={stats.totalOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('total_amount')}
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('pending_approval')}
              value={stats.pendingApproval}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('completed')}
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card>
            <ReactECharts option={orderTrendOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <ReactECharts option={categoryPieOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
