import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Space,
  Typography,
  Table,
  Tag,
  Progress,
  Alert,
  List,
  Tooltip,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { completionApi } from '../services/api'
import type {
  CompletionRateData,
  AbandonedCategory,
  CompletionStats,
} from '../types'

const { Title, Text, Paragraph } = Typography

interface CompletionAnalysisProps {
  readerId: number | null
}

function CompletionAnalysis({ readerId }: CompletionAnalysisProps) {
  const [months, setMonths] = useState(6)
  const [rateData, setRateData] = useState<CompletionRateData[]>([])
  const [abandonedCategories, setAbandonedCategories] = useState<AbandonedCategory[]>([])
  const [stats, setStats] = useState<CompletionStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (readerId) {
      loadData()
    }
  }, [readerId, months])

  const loadData = async () => {
    if (!readerId) return
    setLoading(true)
    try {
      const [rateRes, abandonRes, statsRes] = await Promise.all([
        completionApi.getMonthlyCompletionRate(readerId, months),
        completionApi.getAbandonedCategories(readerId),
        completionApi.getCompletionStats(readerId),
      ])
      setRateData(rateRes.data.data)
      setAbandonedCategories(abandonRes.data.data)
      setStats(statsRes.data.data)
    } catch (error) {
      console.error('Failed to load completion data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRateColor = (rate: number) => {
    if (rate >= 0.7) return '#52c41a'
    if (rate >= 0.4) return '#faad14'
    return '#ff4d4f'
  }

  const getAbandonRateColor = (rate: number) => {
    if (rate >= 0.5) return '#ff4d4f'
    if (rate >= 0.3) return '#faad14'
    return '#52c41a'
  }

  const getTrendChartOption = () => {
    if (rateData.length === 0) {
      return {
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
        },
      }
    }

    return {
      title: {
        text: '完本率趋势',
        subtext: '展示每月完本率的变化情况',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          const monthData = rateData.find((d) => d.month === data.name)
          if (!monthData) return data.name
          return `
            <strong>${data.name}</strong><br/>
            完本率: ${(monthData.completionRate * 100).toFixed(1)}%<br/>
            总借阅: ${monthData.totalBorrows}本<br/>
            已读完: ${monthData.completedCount}本<br/>
            已弃读: ${monthData.abandonedCount}本
          `
        },
      },
      legend: {
        data: ['完本率', '已读完', '已弃读'],
        top: 50,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 100,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: rateData.map((d) => d.month),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '完本率',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: (value: number) => (value * 100).toFixed(0) + '%',
          },
        },
        {
          type: 'value',
          name: '数量',
          min: 0,
        },
      ],
      series: [
        {
          name: '完本率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: {
            width: 3,
            color: '#1890ff',
          },
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
          yAxisIndex: 0,
          data: rateData.map((d) => d.completionRate),
        },
        {
          name: '已读完',
          type: 'bar',
          barWidth: '30%',
          itemStyle: {
            color: '#52c41a',
          },
          yAxisIndex: 1,
          data: rateData.map((d) => d.completedCount),
        },
        {
          name: '已弃读',
          type: 'bar',
          barWidth: '30%',
          itemStyle: {
            color: '#ff4d4f',
          },
          yAxisIndex: 1,
          data: rateData.map((d) => d.abandonedCount),
        },
      ],
    }
  }

  const highAbandonCategories = abandonedCategories.filter((c) => c.abandonRate >= 0.3)

  const abandonTableColumns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: AbandonedCategory) => (
        <Space>
          <Tag color={record.abandonRate >= 0.5 ? 'red' : record.abandonRate >= 0.3 ? 'orange' : 'green'}>
            {text}
          </Tag>
          {record.abandonRate >= 0.5 && (
            <Tooltip title="该类型弃读率超过50%，建议减少推荐">
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '总借阅',
      dataIndex: 'totalBorrows',
      key: 'totalBorrows',
      sorter: (a: AbandonedCategory, b: AbandonedCategory) => a.totalBorrows - b.totalBorrows,
    },
    {
      title: '弃读数',
      dataIndex: 'abandonedCount',
      key: 'abandonedCount',
      sorter: (a: AbandonedCategory, b: AbandonedCategory) => a.abandonedCount - b.abandonedCount,
    },
    {
      title: '弃读率',
      dataIndex: 'abandonRate',
      key: 'abandonRate',
      sorter: (a: AbandonedCategory, b: AbandonedCategory) => a.abandonRate - b.abandonRate,
      render: (value: number) => (
        <Progress
          percent={Math.round(value * 100)}
          size="small"
          strokeColor={getAbandonRateColor(value)}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: AbandonedCategory) => {
        if (record.abandonRate >= 0.5) {
          return (
            <Tag icon={<CloseCircleOutlined />} color="red">
              高风险
            </Tag>
          )
        } else if (record.abandonRate >= 0.3) {
          return (
            <Tag icon={<WarningOutlined />} color="orange">
              中风险
            </Tag>
          )
        }
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            低风险
          </Tag>
        )
      },
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          完本率分析
        </Title>
        <Select
          value={months}
          onChange={setMonths}
          style={{ width: 150 }}
          options={[
            { label: '近3个月', value: 3 },
            { label: '近6个月', value: 6 },
            { label: '近12个月', value: 12 },
          ]}
        />
      </Space>

      {highAbandonCategories.length > 0 && (
        <Alert
          message="弃读警示"
          description={
            <span>
              检测到 <strong>{highAbandonCategories.length}</strong> 个高弃读率类型（弃读率≥30%）：
              {highAbandonCategories.map((c, i) => (
                <Tag key={c.category} color="red" style={{ marginLeft: 8 }}>
                  {c.category}（{(c.abandonRate * 100).toFixed(0)}%）
                </Tag>
              ))}
              <br />
              系统已自动降低这些类型书籍的推荐权重。
            </span>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总体完本率"
              value={stats ? stats.overallCompletionRate * 100 : 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: stats ? getRateColor(stats.overallCompletionRate) : '#000' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均完本率"
              value={stats ? stats.averageCompletionRate * 100 : 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: stats ? getRateColor(stats.averageCompletionRate) : '#000' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已读完"
              value={stats?.completedCount || 0}
              suffix="本"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已弃读"
              value={stats?.abandonedCount || 0}
              suffix="本"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="擅长阅读类型" size="small">
              <List
                size="small"
                dataSource={stats.bestCategories}
                locale={{ emptyText: '暂无数据' }}
                renderItem={(item) => (
                  <List.Item>
                    <Tag icon={<CheckCircleOutlined />} color="green">
                      {item}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="高弃读类型（系统已降权）" size="small">
              <List
                size="small"
                dataSource={stats.worstCategories}
                locale={{ emptyText: '暂无高弃读类型' }}
                renderItem={(item) => (
                  <List.Item>
                    <Tag icon={<WarningOutlined />} color="red">
                      {item}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card loading={loading} style={{ marginBottom: 24 }}>
        <ReactECharts option={getTrendChartOption()} style={{ height: 400 }} />
      </Card>

      <Card title="各类别弃读率分析" loading={loading}>
        <Table
          columns={abandonTableColumns}
          dataSource={abandonedCategories}
          rowKey="category"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 16, background: '#fafafa' }}>
                <Paragraph>
                  <Text strong>分析：</Text>
                  {record.abandonRate >= 0.5
                    ? `该类型书籍弃读率高达${(record.abandonRate * 100).toFixed(0)}%，建议：
                    1. 减少该类型的推荐数量
                    2. 可推荐该类型的短篇或入门级作品
                    3. 考虑是否需要调整阅读目标`
                    : record.abandonRate >= 0.3
                    ? `该类型书籍弃读率为${(record.abandonRate * 100).toFixed(0)}%，需要关注：
                    1. 可能是书籍选择问题，可尝试该类型的经典作品
                    2. 检查是否阅读时机不合适`
                    : `该类型书籍表现良好，弃读率仅${(record.abandonRate * 100).toFixed(0)}%，可以继续推荐。`}
                </Paragraph>
              </div>
            ),
          }}
        />
      </Card>

      <Card title="完本率计算说明" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 1.8 }}>
          <Paragraph>
            <Text strong>完本率计算方式：</Text>
          </Paragraph>
          <ul style={{ marginLeft: 20 }}>
            <li>
              <Text strong>应读时间预估</Text>
              ：根据书籍页数计算（默认每天阅读20页），例如300页需要15天
            </li>
            <li>
              <Text strong>实际阅读时间</Text>
              ：从借阅时间到归还时间的天数
            </li>
            <li>
              <Text strong>完本率</Text>
              ：min(实际阅读时间 / 应读时间, 1.0)
            </li>
            <li>
              <Text strong>判定标准</Text>
              ：
              <Tag color="green">完本率≥70%</Tag> 视为已读完，
              <Tag color="red">完本率<30%</Tag> 视为弃读
            </li>
          </ul>

          <Paragraph style={{ marginTop: 16 }}>
            <Text strong>推荐优化策略：</Text>
          </Paragraph>
          <ul style={{ marginLeft: 20 }}>
            <li>
              <Tag color="red">高弃读（≥50%）</Tag>
              ：推荐权重降低80%
            </li>
            <li>
              <Tag color="orange">中弃读（30%-50%）</Tag>
              ：推荐权重降低50%
            </li>
            <li>
              <Tag color="gold">低弃读（10%-30%）</Tag>
              ：推荐权重根据弃读率动态调整
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default CompletionAnalysis
