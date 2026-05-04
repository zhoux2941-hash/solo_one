import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Modal,
  Descriptions,
  message,
  Spin
} from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { logApi } from '../services/api'
import '../App.css'

const { RangePicker } = DatePicker
const { Option } = Select
const { Search } = Input

interface LogEntry {
  id: string
  timestamp?: string
  level?: string
  message?: string
  rawLog?: string
  source?: string
  logType?: string
  fields?: Record<string, unknown>
  createdAt?: string
}

interface SearchParams {
  startTime?: string
  endTime?: string
  keyword?: string
  level?: string
  logType?: string
  source?: string
  page: number
  size: number
}

const LogSearch = () => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 搜索条件
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState<string | undefined>(undefined)
  const [logType, setLogType] = useState<string | undefined>(undefined)
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: SearchParams = {
        page: currentPage - 1,
        size: pageSize
      }

      if (keyword) {
        params.keyword = keyword
      }
      if (level) {
        params.level = level
      }
      if (logType) {
        params.logType = logType
      }
      if (timeRange && timeRange.length === 2) {
        params.startTime = timeRange[0].toISOString()
        params.endTime = timeRange[1].toISOString()
      }

      const response = await logApi.searchLogs(params)

      if (response.data.success) {
        const data = response.data.data
        setLogs(data.content || [])
        setTotal(data.totalElements || 0)
      } else {
        message.error('搜索失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('搜索日志失败:', error)
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, pageSize])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLogs()
  }

  const handleReset = () => {
    setKeyword('')
    setLevel(undefined)
    setLogType(undefined)
    setTimeRange(null)
    setCurrentPage(1)
    setTimeout(() => fetchLogs(), 0)
  }

  const showDetail = (log: LogEntry) => {
    setSelectedLog(log)
    setDetailModalVisible(true)
  }

  // 获取级别标签
  const getLevelTag = (level?: string) => {
    if (!level) return <Tag>UNKNOWN</Tag>
    
    const colors: Record<string, string> = {
      'DEBUG': 'blue',
      'INFO': 'green',
      'WARN': 'gold',
      'ERROR': 'red',
      'FATAL': 'purple'
    }
    return (
      <Tag color={colors[level] || 'default'} className="log-level-tag">
        {level}
      </Tag>
    )
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp?: string) => timestamp ? 
        dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS') : '-'
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level?: string) => getLevelTag(level)
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message?: string) => (
        <span className="log-message" title={message}>
          {message || '-'}
        </span>
      )
    },
    {
      title: '类型',
      dataIndex: 'logType',
      key: 'logType',
      width: 120,
      render: (type?: string) => type ? 
        <Tag color="blue">{type.toUpperCase()}</Tag> : '-'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source?: string) => source || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: LogEntry) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="log-search">
      <Card>
        {/* 搜索条件 */}
        <div className="filter-panel">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div>
              <label style={{ marginRight: 8 }}>关键词:</label>
              <Search
                placeholder="搜索消息、原始日志..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
            </div>

            <div>
              <label style={{ marginRight: 8 }}>时间范围:</label>
              <RangePicker
                showTime
                value={timeRange}
                onChange={dates => setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                style={{ width: 280 }}
                allowClear
              />
            </div>

            <div>
              <label style={{ marginRight: 8 }}>级别:</label>
              <Select
                placeholder="全部级别"
                allowClear
                value={level}
                onChange={setLevel}
                style={{ width: 120 }}
              >
                <Option value="DEBUG">DEBUG</Option>
                <Option value="INFO">INFO</Option>
                <Option value="WARN">WARN</Option>
                <Option value="ERROR">ERROR</Option>
                <Option value="FATAL">FATAL</Option>
              </Select>
            </div>

            <div>
              <label style={{ marginRight: 8 }}>类型:</label>
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
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  搜索
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <Spin spinning={loading}>
          <Table
            className="log-table"
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条日志`,
              onChange: (page, size) => {
                setCurrentPage(page)
                setPageSize(size)
              }
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onOk={() => setDetailModalVisible(false)}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="时间">
              {selectedLog.timestamp ? 
                dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="级别">
              {getLevelTag(selectedLog.level)}
            </Descriptions.Item>
            <Descriptions.Item label="日志类型">
              {selectedLog.logType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="来源">
              {selectedLog.source || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="消息">
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 12,
                background: '#f5f5f5',
                padding: 8,
                borderRadius: 4
              }}>
                {selectedLog.message || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="原始日志">
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 12,
                background: '#f5f5f5',
                padding: 8,
                borderRadius: 4
              }}>
                {selectedLog.rawLog || '-'}
              </div>
            </Descriptions.Item>
            {selectedLog.fields && Object.keys(selectedLog.fields).length > 0 && (
              <Descriptions.Item label="额外字段">
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 12,
                  background: '#f5f5f5',
                  padding: 8,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.fields, null, 2)}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="入库时间">
              {selectedLog.createdAt ? 
                dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default LogSearch
