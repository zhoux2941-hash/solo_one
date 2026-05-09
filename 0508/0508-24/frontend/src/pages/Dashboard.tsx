import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, List, Tag, Space } from 'antd'
import { BookOutlined, ThunderboltOutlined, HeartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { analysisApi, borrowApi } from '../services/api'
import type { TagInterest, BorrowRecord, BreadthData } from '../types'

interface DashboardProps {
  readerId: number | null
}

function Dashboard({ readerId }: DashboardProps) {
  const [interests, setInterests] = useState<TagInterest[]>([])
  const [breadthData, setBreadthData] = useState<BreadthData[]>([])
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (readerId) {
      loadData()
    }
  }, [readerId])

  const loadData = async () => {
    if (!readerId) return
    setLoading(true)
    try {
      const [interestRes, breadthRes, recordsRes] = await Promise.all([
        analysisApi.getInterestVector(readerId),
        analysisApi.getReadingBreadth(readerId, 6),
        borrowApi.getByReader(readerId),
      ])
      setInterests(interestRes.data.data.slice(0, 5))
      setBreadthData(breadthRes.data.data)
      setBorrowRecords(recordsRes.data.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBreadthChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: breadthData.map((d) => d.month),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '类别数量',
      },
      series: [
        {
          data: breadthData.map((d) => d.categoryCount),
          type: 'line',
          smooth: true,
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.3)',
          },
          lineStyle: {
            color: '#1890ff',
          },
        },
      ],
    }
  }

  const getInterestChartOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {c}',
          },
          data: interests.map((i, idx) => ({
            value: (i.storedWeight ?? i.weight ?? 0).toFixed(2),
            name: i.tag,
            itemStyle: {
              color: [
                '#1890ff',
                '#52c41a',
                '#faad14',
                '#f5222d',
                '#722ed1',
              ][idx % 5],
            },
          })),
        },
      ],
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>读者概览</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="阅读类别数"
              value={breadthData[breadthData.length - 1]?.categoryCount || 0}
              prefix={<BookOutlined />}
              suffix="类"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总借阅次数"
              value={borrowRecords.length}
              prefix={<ThunderboltOutlined />}
              suffix="本"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="兴趣标签数"
              value={interests.length}
              prefix={<HeartOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="兴趣分布" loading={loading}>
            {interests.length > 0 ? (
              <ReactECharts option={getInterestChartOption()} style={{ height: 350 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 50 }}>暂无兴趣数据</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="阅读广度趋势" loading={loading}>
            {breadthData.length > 0 ? (
              <ReactECharts option={getBreadthChartOption()} style={{ height: 350 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 50 }}>暂无阅读广度数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="热门兴趣标签" loading={loading}>
            <Space wrap size={[8, 8]}>
              {interests.map((interest, idx) => (
                <Tag
                  key={interest.tag}
                  color={['blue', 'green', 'orange', 'red', 'purple'][idx % 5]}
                  style={{ fontSize: 14, padding: '4px 12px' }}
                >
                  {interest.tag}
                  <span style={{ marginLeft: 8, opacity: 0.8 }}>
                    权重: {(interest.storedWeight ?? interest.weight ?? 0).toFixed(2)}
                  </span>
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近借阅" loading={loading}>
            <List
              dataSource={borrowRecords}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={`借阅记录 #${item.id}`}
                    description={
                      <Space split={<span>|</span>}>
                        <span>时间: {item.borrowTime}</span>
                        <span>类别: {item.category || '未知'}</span>
                        {item.tags && <span>标签: {item.tags}</span>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
