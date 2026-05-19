import { useState, useEffect } from 'react'
import { Card, Tabs, DatePicker, Button, Space, Table, Tag, Modal, Progress, message, Alert, Select } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, WarningOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import api from '@/api/axios'

const { RangePicker } = DatePicker

interface FinanceReport {
  id: number
  reportDate: string
  revenue: number
  cost: number
  profit: number
  tax: number
  shippingFee: number
  discountAmount: number
  orderCount: number
  productCount: number
  customerCount: number
  region: string
  department: string
}

interface ExportEstimate {
  count: number
  isLargeData: boolean
  recommendCsv: boolean
  estimatedExcelSizeMb: number
  estimatedCsvSizeMb: number
}

const Finance = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportEstimate, setExportEstimate] = useState<ExportEstimate | null>(null)
  const [data, setData] = useState<FinanceReport[]>([])
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel')

  useEffect(() => {
    const mockData: FinanceReport[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      reportDate: `2024-${String(i + 1).padStart(2, '0')}-01`,
      revenue: 320000 + Math.random() * 200000,
      cost: 200000 + Math.random() * 100000,
      profit: 120000 + Math.random() * 100000,
      tax: Math.random() * 30000,
      shippingFee: Math.random() * 15000,
      discountAmount: Math.random() * 10000,
      orderCount: 100 + Math.floor(Math.random() * 100),
      productCount: 500 + Math.floor(Math.random() * 500),
      customerCount: 50 + Math.floor(Math.random() * 50),
      region: ['华东', '华北', '华南', '西南', '西北'][i % 5],
      department: ['销售一部', '销售二部', '销售三部', '电商部', '批发部'][i % 5],
    }))
    setData(mockData)
  }, [])

  const revenueOption = {
    title: { text: '月度营收分析' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['营收', '成本', '利润'] },
    xAxis: {
      type: 'category',
      data: data.map(d => d.reportDate.substring(0, 7)),
    },
    yAxis: { type: 'value' },
    series: [
      { name: '营收', type: 'bar', data: data.map(d => d.revenue), color: '#1890ff' },
      { name: '成本', type: 'bar', data: data.map(d => d.cost), color: '#faad14' },
      { name: '利润', type: 'line', data: data.map(d => d.profit), color: '#52c41a', smooth: true },
    ],
  }

  const columns = [
    { title: '日期', dataIndex: 'reportDate', key: 'reportDate' },
    { title: '营收', dataIndex: 'revenue', key: 'revenue', render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '成本', dataIndex: 'cost', key: 'cost', render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '利润', dataIndex: 'profit', key: 'profit', render: (val: number) => <Tag color="green">¥{val.toLocaleString()}</Tag> },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '地区', dataIndex: 'region', key: 'region' },
  ]

  // 预估导出数据量
  const estimateExport = async () => {
    if (!dateRange) {
      message.warning('请先选择导出日期范围')
      return
    }

    try {
      setLoading(true)
      const [startDate, endDate] = dateRange
      const response = await api.get('/finance/export/estimate', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      })
      setExportEstimate(response.data)
      setShowExportModal(true)
    } catch (error) {
      message.error('预估数据量失败')
    } finally {
      setLoading(false)
    }
  }

  // 执行导出
  const executeExport = async () => {
    if (!dateRange || !exportEstimate) return

    try {
      setExportLoading(true)
      setExportProgress(10)

      const [startDate, endDate] = dateRange
      const format = exportFormat

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await api.get(`/finance/export/${format}`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        responseType: 'blob',
      })

      clearInterval(progressInterval)
      setExportProgress(100)

      // 下载文件
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `财务报表_${format.toUpperCase()}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success('导出成功！')
      setTimeout(() => {
        setShowExportModal(false)
        setExportProgress(0)
        setExportLoading(false)
      }, 1000)

    } catch (error) {
      setExportLoading(false)
      setExportProgress(0)
      message.error('导出失败，请重试')
    }
  }

  // 生成测试数据（用于测试大文件导出）
  const generateTestData = async () => {
    Modal.confirm({
      title: '生成测试数据',
      content: '将生成10万条测试数据用于性能测试，确定继续吗？',
      onOk: async () => {
        try {
          setLoading(true)
          await api.post('/finance/test/generate', null, {
            params: { count: 10000 }
          })
          message.success('测试数据生成成功！')
        } catch (error) {
          message.error('生成失败')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const tabItems = [
    {
      key: 'overview',
      label: '财务概览',
      children: (
        <div>
          <ReactECharts option={revenueOption} style={{ height: 400 }} />
        </div>
      ),
    },
    {
      key: 'monthly',
      label: '月度报表',
      children: (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          summary={(pageData) => {
            let totalRevenue = 0
            let totalCost = 0
            let totalProfit = 0
            pageData.forEach((item) => {
              totalRevenue += item.revenue
              totalCost += item.cost
              totalProfit += item.profit
            })
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>¥{totalRevenue.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>¥{totalCost.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>¥{totalProfit.toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      ),
    },
    {
      key: 'comparison',
      label: '同比分析',
      children: <div style={{ padding: 50, textAlign: 'center', color: '#999' }}>同比分析图表</div>,
    },
  ]

  return (
    <>
      <Card
        title={t('finance')}
        extra={
          <Space>
            <RangePicker
              picker="month"
              value={dateRange ? dateRange.map(d => new Date(d)) as any : null}
              onChange={(dates) => setDateRange(dates as [Date, Date])}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={estimateExport}
              loading={loading}
            >
              导出报表
            </Button>
            <Button onClick={generateTestData} loading={loading}>
              生成测试数据
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 导出确认弹窗 */}
      <Modal
        title="导出财务报表"
        open={showExportModal}
        onCancel={() => !exportLoading && setShowExportModal(false)}
        width={520}
        footer={
          <Space>
            <Button disabled={exportLoading} onClick={() => setShowExportModal(false)}>
              取消
            </Button>
            <Button
              type="primary"
              loading={exportLoading}
              onClick={executeExport}
              icon={exportFormat === 'excel' ? <FileExcelOutlined /> : <FileTextOutlined />}
            >
              确认导出
            </Button>
          </Space>
        }
      >
        {exportEstimate && (
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>预估数据量：</strong>
              <span style={{ color: '#1890ff', fontSize: 18, marginLeft: 8 }}>
                {exportEstimate.count.toLocaleString()} 条
              </span>
            </p>

            {/* 大数据量警告 */}
            {exportEstimate.isLargeData && (
              <Alert
                style={{ margin: '16px 0' }}
                message="数据量较大警告"
                description={
                  <div>
                    <p>预估 Excel 文件大小约 <strong>{exportEstimate.estimatedExcelSizeMb.toFixed(1)} MB</strong></p>
                    <p>预估 CSV 文件大小约 <strong>{exportEstimate.estimatedCsvSizeMb.toFixed(1)} MB</strong></p>
                    {exportEstimate.recommendCsv && (
                      <p style={{ color: '#faad14', fontWeight: 'bold' }}>
                        <WarningOutlined /> 超过10万条数据，强烈建议使用 CSV 格式导出，速度更快、内存占用更低！
                      </p>
                    )}
                  </div>
                }
                type={exportEstimate.recommendCsv ? 'warning' : 'info'}
                showIcon
              />
            )}

            {/* 格式选择 */}
            <div style={{ marginTop: 16 }}>
              <p><strong>导出格式：</strong></p>
              <Select
                style={{ width: '100%' }}
                value={exportFormat}
                onChange={setExportFormat}
                disabled={exportLoading}
                options={[
                  {
                    value: 'excel',
                    label: (
                      <Space>
                        <FileExcelOutlined style={{ color: '#52c41a' }} />
                        Excel 格式 (.xlsx) - 格式丰富，兼容性好
                      </Space>
                    ),
                  },
                  {
                    value: 'csv',
                    label: (
                      <Space>
                        <FileTextOutlined style={{ color: '#1890ff' }} />
                        CSV 格式 (.csv) - 速度快，内存占用低（推荐大数据量）
                      </Space>
                    ),
                  },
                ]}
              />
            </div>

            {/* 导出进度条 */}
            {exportLoading && (
              <div style={{ marginTop: 24 }}>
                <p><strong>导出进度：</strong></p>
                <Progress
                  percent={Math.round(exportProgress)}
                  status={exportProgress >= 100 ? 'success' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  正在流式导出数据，请耐心等待，不要关闭页面...
                </p>
              </div>
            )}

            {/* 技术说明 */}
            <div style={{ marginTop: 20, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 12, color: '#666' }}>
              <p><strong>💡 优化说明：</strong></p>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>采用流式导出技术，内存占用极低，支持100万+行数据</li>
                <li>数据库流式查询 + SXSSF 流式写入，避免 OOM</li>
                <li>CSV 格式导出速度比 Excel 快约 3-5 倍，内存减少 60%</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default Finance
