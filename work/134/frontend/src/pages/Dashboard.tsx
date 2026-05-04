import { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Select, DatePicker, Tag, List, Spin, message, 
  Statistic, Button, Modal, Table, Empty, Alert, Timeline, Tooltip,
  Descriptions, Divider
} from 'antd'
import {
  ClockCircleOutlined, WarningOutlined, FileTextOutlined, BugOutlined,
  BellOutlined, CheckCircleOutlined, FireOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { statsApi, anomalyApi } from '../services/api'
import '../App.css'

const { RangePicker } = DatePicker
const { Option } = Select

interface DashboardData {
  levelDistribution: Record<string, number>
  timeHistogram: Record<string, number>
  topErrors: Array<{
    message: string
    timestamp: string
    source: string
    logType: string
  }>
  totalCount: number
  errorCount: number
  warnCount: number
}

interface AnomalyRecord {
  id: number
  anomalyTime: string
  anomalyType: string
  anomalyLevel: string
  score: number
  threshold: number
  actualValue: number
  message: string
  logType: string
  source: string
  details: string
  isAcknowledged: boolean
  acknowledgedAt: string
  acknowledgedBy: string
  createdAt: string
}

interface AnomalyStats {
  unacknowledgedCount: number
  totalCount: number
  recentAnomalies: AnomalyRecord[]
  todayUnacknowledgedCount: number
}

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(24, 'hour'),
    dayjs()
  ])
  const [interval, setInterval] = useState('1h')
  const [logType, setLogType] = useState<string | undefined>(undefined)

  const [anomalyStats, setAnomalyStats] = useState<AnomalyStats | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([])
  const [showAnomalyModal, setShowAnomalyModal] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        interval
      }
      
      if (timeRange && timeRange.length === 2) {
        params.startTime = timeRange[0].toISOString()
        params.endTime = timeRange[1].toISOString()
      }
      
      if (logType) {
        params.logType = logType
      }

      const [dashboardRes, anomalyStatsRes, anomaliesRes] = await Promise.all([
        statsApi.getDashboardStats(params),
        anomalyApi.getAnomalyStats(),
        anomalyApi.getAnomaliesByRange({
          startTime: timeRange[0].toISOString(),
          endTime: timeRange[1].toISOString(),
          logType
        })
      ])
      
      if (dashboardRes.data.success) {
        setData(dashboardRes.data.data)
      } else {
        message.error('获取仪表盘数据失败: ' + dashboardRes.data.message)
      }

      if (anomalyStatsRes.data.success) {
        setAnomalyStats(anomalyStatsRes.data.data)
      }

      if (anomaliesRes.data.success) {
        setAnomalies(anomaliesRes.data.data)
      }

    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange, interval, logType])

  const acknowledgeAnomaly = async (id: number) => {
    try {
      const response = await anomalyApi.acknowledgeAnomaly(id, 'SYSTEM')
      if (response.data.success) {
        message.success('异常已确认')
        fetchDashboardData()
      }
    } catch (error) {
      console.error('确认异常失败:', error)
      message.error('确认失败')
    }
  }

  const getAnomalyLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'CRITICAL': '#f5222d',
      'WARNING': '#faad14',
      'INFO': '#1890ff',
      'NORMAL': '#52c41a'
    }
    return colors[level] || '#999'
  }

  const getAnomalyLevelTagColor = (level: string) => {
    const colors: Record<string, string> = {
      'CRITICAL': 'red',
      'WARNING': 'orange',
      'INFO': 'blue',
      'NORMAL': 'green'
    }
    return colors[level] || 'default'
  }

  const getAnomalyTimeKey = (timeStr: string) => {
    if (!timeStr) return ''
    const t = dayjs(timeStr)
    return t.format('YYYY-MM-DD HH:mm:00')
  }

  const getLevelPieChart = () => {
    if (!data || !data.levelDistribution) {
      return {
        tooltip: { trigger: 'item' },
        legend: { top: 'bottom' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: []
        }]
      }
    }

    const levelColors: Record<string, string> = {
      'DEBUG': '#108ee9',
      'INFO': '#52c41a',
      'WARN': '#faad14',
      'ERROR': '#f5222d',
      'FATAL': '#722ed1'
    }

    const chartData = Object.entries(data.levelDistribution).map(([level, count]) => ({
      name: level,
      value: count,
      itemStyle: { color: levelColors[level] || '#999' }
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 10
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: chartData
      }]
    }
  }

  const getTimeHistogram = () => {
    if (!data || !data.timeHistogram) {
      return {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [] }]
      }
    }

    const chartData = Object.entries(data.timeHistogram)
      .sort((a, b) => a[0].localeCompare(b[0]))

    const anomalyMap = new Map<string, AnomalyRecord>()
    anomalies.forEach(a => {
      const key = getAnomalyTimeKey(a.anomalyTime)
      if (a.anomalyLevel !== 'NORMAL') {
        anomalyMap.set(key, a)
      }
    })

    const itemStyles: any[] = []
    const xAxisData = chartData.map(d => {
      const xLabel = d[0]
      const anomaly = anomalyMap.get(xLabel)
      if (anomaly && anomaly.anomalyLevel !== 'NORMAL') {
        itemStyles.push({
          color: getAnomalyLevelColor(anomaly.anomalyLevel),
          borderColor: getAnomalyLevelColor(anomaly.anomalyLevel),
          borderWidth: 2
        })
      } else {
        itemStyles.push({ color: '#1890ff' })
      }
      return xLabel
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const xValue = params[0].axisValue
          const anomaly = anomalyMap.get(xValue)
          let result = `${xValue}<br/>日志数: ${params[0].value}`
          if (anomaly && anomaly.anomalyLevel !== 'NORMAL') {
            result += `<br/><span style="color:${getAnomalyLevelColor(anomaly.anomalyLevel)}">`
            result += `⚠️ 异常检测: ${anomaly.message}`
            result += `<br/>异常分数: ${anomaly.score.toFixed(2)}σ`
            result += `</span>`
          }
          return result
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 10
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: '日志数'
      },
      series: [{
        type: 'bar',
        data: chartData.map((d, i) => ({
          value: d[1],
          itemStyle: itemStyles[i]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }],
      graphic: anomalies
        .filter(a => a.anomalyLevel !== 'NORMAL')
        .map((anomaly, index) => {
          const key = getAnomalyTimeKey(anomaly.anomalyTime)
          const xIndex = xAxisData.findIndex(x => x === key)
          if (xIndex === -1) return null

          return {
            type: 'text',
            left: `${(xIndex + 0.5) / xAxisData.length * 100}%`,
            top: '5%',
            style: {
              text: anomaly.anomalyLevel === 'CRITICAL' ? '🔥' : '⚠️',
              fontSize: 14
            }
          }
        }).filter(Boolean)
    }
  }

  const getLevelTag = (level: string) => {
    const colors: Record<string, string> = {
      'DEBUG': 'blue',
      'INFO': 'green',
      'WARN': 'gold',
      'ERROR': 'red',
      'FATAL': 'purple'
    }
    return <Tag color={colors[level] || 'default'}>{level}</Tag>
  }

  const anomalyColumns = [
    {
      title: '异常级别',
      dataIndex: 'anomalyLevel',
      key: 'anomalyLevel',
      width: 100,
      render: (level: string) => (
        <Tag color={getAnomalyLevelTagColor(level)}>
          {level === 'CRITICAL' && <FireOutlined style={{ marginRight: 4 }} />}
          {level === 'WARNING' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
          {level}
        </Tag>
      )
    },
    {
      title: '异常时间',
      dataIndex: 'anomalyTime',
      key: 'anomalyTime',
      width: 180,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '异常分数 (σ)',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', color: getAnomalyLevelColor(anomalies.find(a => a.score === score)?.anomalyLevel || 'INFO') }}>
          {score?.toFixed(2) || 0}
        </span>
      )
    },
    {
      title: '当前日志量',
      dataIndex: 'actualValue',
      key: 'actualValue',
      width: 120
    },
    {
      title: '报警阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      width: 100,
      render: (val: number) => val?.toFixed(0) || 0
    },
    {
      title: '日志类型',
      dataIndex: 'logType',
      key: 'logType',
      width: 100,
      render: (type: string) => type ? <Tag color="blue">{type}</Tag> : '-'
    },
    {
      title: '状态',
      dataIndex: 'isAcknowledged',
      key: 'isAcknowledged',
      width: 100,
      render: (ack: boolean) => (
        <Tag color={ack ? 'green' : 'orange'}>
          {ack ? <CheckCircleOutlined /> : <BellOutlined />}
          {ack ? '已确认' : '未确认'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: AnomalyRecord) => (
        <div style={{ gap: 8, display: 'flex' }}>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedAnomaly(record)
              setShowAnomalyModal(true)
            }}
          >
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            详情
          </Button>
          {!record.isAcknowledged && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => acknowledgeAnomaly(record.id)}
            >
              确认
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="dashboard">
      {anomalyStats && anomalyStats.unacknowledgedCount > 0 && (
        <Alert
          message={
            <span>
              <FireOutlined style={{ marginRight: 8, color: '#f5222d' }} />
              存在 <strong style={{ color: '#f5222d' }}>{anomalyStats.unacknowledgedCount}</strong> 个未确认的异常，请及时处理
            </span>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setShowAnomalyModal(true)}>
              查看异常
            </Button>
          }
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <span style={{ marginRight: 8 }}>时间范围:</span>
            <RangePicker
              showTime
              value={timeRange}
              onChange={(dates) => dates && setTimeRange([dates[0]!, dates[1]!])}
              style={{ width: '80%' }}
            />
          </Col>
          <Col span={4}>
            <span style={{ marginRight: 8 }}>时间间隔:</span>
            <Select
              value={interval}
              onChange={setInterval}
              style={{ width: 100 }}
            >
              <Option value="1m">1分钟</Option>
              <Option value="5m">5分钟</Option>
              <Option value="30m">30分钟</Option>
              <Option value="1h">1小时</Option>
              <Option value="1d">1天</Option>
            </Select>
          </Col>
          <Col span={4}>
            <span style={{ marginRight: 8 }}>日志类型:</span>
            <Select
              placeholder="全部类型"
              allowClear
              value={logType}
              onChange={setLogType}
              style={{ width: 120 }}
            >
              <Option value="nginx">Nginx</Option>
              <Option value="apache">Apache</Option>
              <Option value="json_lines">JSON Lines</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Button onClick={fetchDashboardData} loading={loading}>
              刷新数据
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={data?.totalCount || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误日志"
              value={data?.errorCount || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告日志"
              value={data?.warnCount || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            onClick={() => setShowAnomalyModal(true)}
            style={{ cursor: 'pointer' }}
            extra={
              <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); setShowAnomalyModal(true) }}>
                查看详情
              </Button>
            }
          >
            <Statistic
              title="未确认异常"
              value={anomalyStats?.unacknowledgedCount || 0}
              valueStyle={{ 
                color: (anomalyStats?.unacknowledgedCount || 0) > 0 ? '#f5222d' : '#52c41a' 
              }}
              prefix={
                (anomalyStats?.unacknowledgedCount || 0) > 0 
                  ? <BellOutlined style={{ animation: 'pulse 1.5s infinite' }} />
                  : <CheckCircleOutlined />
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="日志级别分布" className="dashboard-card">
            <Spin spinning={loading}>
              <ReactECharts
                option={getLevelPieChart()}
                style={{ height: 350 }}
                opts={{ renderer: 'canvas' }}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <span>
                日志时间分布
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  异常时间段已高亮
                </Tag>
              </span>
            } 
            className="dashboard-card"
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag color="red">🔥 CRITICAL</Tag>
                <Tag color="orange">⚠️ WARNING</Tag>
                <Tag color="blue">正常</Tag>
              </div>
            }
          >
            <Spin spinning={loading}>
              <ReactECharts
                option={getTimeHistogram()}
                style={{ height: 350 }}
                opts={{ renderer: 'canvas' }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Top 5 错误消息" className="dashboard-card">
            <Spin spinning={loading}>
              {data?.topErrors && data.topErrors.length > 0 ? (
                <List
                  className="error-list"
                  dataSource={data.topErrors}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="red">{index + 1}</Tag>}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getLevelTag('ERROR')}
                            <span className="error-time">
                              {item.timestamp ? dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'}
                            </span>
                            {item.source && <Tag>{item.source}</Tag>}
                            {item.logType && <Tag color="blue">{item.logType}</Tag>}
                          </div>
                        }
                        description={
                          <div className="error-message">{item.message}</div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                  暂无错误日志数据
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellOutlined style={{ color: '#faad14' }} />
            异常记录管理
          </div>
        }
        open={showAnomalyModal}
        onCancel={() => {
          setShowAnomalyModal(false)
          setSelectedAnomaly(null)
        }}
        width={1200}
        footer={
          <Button onClick={() => {
            setShowAnomalyModal(false)
            setSelectedAnomaly(null)
          }}>
            关闭
          </Button>
        }
      >
        {selectedAnomaly ? (
          <div>
            <Button 
              type="link" 
              onClick={() => setSelectedAnomaly(null)}
              style={{ marginBottom: 16 }}
            >
              ← 返回列表
            </Button>
            
            <Card title="异常详情">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="异常级别">
                  <Tag color={getAnomalyLevelTagColor(selectedAnomaly.anomalyLevel)}>
                    {selectedAnomaly.anomalyLevel}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="异常类型">
                  {selectedAnomaly.anomalyType || 'SPIKE'}
                </Descriptions.Item>
                <Descriptions.Item label="异常时间">
                  {selectedAnomaly.anomalyTime 
                    ? dayjs(selectedAnomaly.anomalyTime).format('YYYY-MM-DD HH:mm:ss') 
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="日志类型">
                  {selectedAnomaly.logType ? <Tag color="blue">{selectedAnomaly.logType}</Tag> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="当前日志量">
                  <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                    {selectedAnomaly.actualValue?.toFixed(0) || 0}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="报警阈值">
                  <span>{selectedAnomaly.threshold?.toFixed(0) || 0}</span>
                </Descriptions.Item>
                <Descriptions.Item label="异常分数 (σ)">
                  <span 
                    style={{ 
                      fontWeight: 'bold', 
                      fontSize: 18,
                      color: getAnomalyLevelColor(selectedAnomaly.anomalyLevel)
                    }}
                  >
                    {selectedAnomaly.score?.toFixed(2) || 0} σ
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selectedAnomaly.isAcknowledged ? 'green' : 'orange'}>
                    {selectedAnomaly.isAcknowledged ? '已确认' : '未确认'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div style={{ marginBottom: 16 }}>
                <h4>异常描述</h4>
                <Alert
                  message={selectedAnomaly.message || '暂无描述'}
                  type="warning"
                  showIcon
                />
              </div>

              {selectedAnomaly.details && (
                <div>
                  <h4>详细数据</h4>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    fontSize: 12,
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(JSON.parse(selectedAnomaly.details), null, 2)}
                  </pre>
                </div>
              )}

              {!selectedAnomaly.isAcknowledged && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button 
                    type="primary"
                    onClick={() => {
                      acknowledgeAnomaly(selectedAnomaly.id)
                      setSelectedAnomaly(null)
                    }}
                  >
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    确认此异常
                  </Button>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Alert
                message={
                  <span>
                    异常说明：系统每 1 分钟自动检测日志量是否突增。
                    使用 <strong>滑动窗口算法</strong> 计算历史 30 分钟的均值和标准差，
                    当当前分钟日志量超过 <strong>均值 + 2 倍标准差</strong> 时触发异常报警。
                  </span>
                }
                type="info"
                showIcon
              />
            </div>

            <Table
              columns={anomalyColumns}
              dataSource={anomalies}
              rowKey="id"
              locale={{
                emptyText: (
                  <Empty description="该时间范围内暂无异常记录" />
                )
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Dashboard
