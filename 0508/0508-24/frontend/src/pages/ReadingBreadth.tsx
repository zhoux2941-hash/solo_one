import { useState, useEffect } from 'react'
import { Card, Select, Space, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import { analysisApi } from '../services/api'
import type { BreadthData } from '../types'

const { Title } = Typography

interface ReadingBreadthProps {
  readerId: number | null
}

function ReadingBreadth({ readerId }: ReadingBreadthProps) {
  const [breadthData, setBreadthData] = useState<BreadthData[]>([])
  const [months, setMonths] = useState(6)
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
      const response = await analysisApi.getReadingBreadth(readerId, months)
      setBreadthData(response.data.data)
    } catch (error) {
      console.error('Failed to load reading breadth data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChartOption = () => {
    if (breadthData.length === 0) {
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
        text: '阅读广度曲线',
        subtext: '展示累计阅读类别数量随时间的增长',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `${data.name}<br/>累计类别数：${data.value}`
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: breadthData.map((d) => d.month),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '累计类别数量',
        minInterval: 1,
      },
      series: [
        {
          name: '阅读类别数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#1890ff',
            width: 3,
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
                {
                  offset: 0,
                  color: 'rgba(24, 144, 255, 0.5)',
                },
                {
                  offset: 1,
                  color: 'rgba(24, 144, 255, 0.1)',
                },
              ],
            },
          },
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
            ],
          },
          data: breadthData.map((d) => d.categoryCount),
        },
      ],
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          阅读广度分析
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

      <Card loading={loading}>
        <ReactECharts option={getChartOption()} style={{ height: 450 }} />
      </Card>

      <Card title="阅读广度解读" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>阅读广度</strong>
            衡量的是读者涉猎的书籍类别多样性。曲线越陡峭，表示该时间段内读者接触了更多新的书籍类别。
          </p>
          <p>
            <strong>计算方式</strong>
            ：统计每个月累计的不同书籍类别数量。例如，如果读者在1月借阅了2本科幻类，2月又借阅了1本历史类，那么2月的累计类别数就是2。
          </p>
          <p>
            <strong>应用价值</strong>
            ：
          </p>
          <ul style={{ marginLeft: 20 }}>
            <li>分析读者的阅读兴趣是否越来越广泛</li>
            <li>发现读者是否存在阅读疲劳期（曲线平缓阶段）</li>
            <li>为推荐系统提供多样化推荐的依据</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default ReadingBreadth
