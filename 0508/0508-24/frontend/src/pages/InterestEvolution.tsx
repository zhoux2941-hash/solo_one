import { useState, useEffect } from 'react'
import { Card, Select, Space, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import { analysisApi } from '../services/api'
import type { RiverChartResult } from '../types'

const { Title } = Typography

interface InterestEvolutionProps {
  readerId: number | null
}

const COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
  '#48b8d0',
]

function InterestEvolution({ readerId }: InterestEvolutionProps) {
  const [chartData, setChartData] = useState<RiverChartResult | null>(null)
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
      const response = await analysisApi.getInterestEvolution(readerId, months)
      setChartData(response.data.data)
    } catch (error) {
      console.error('Failed to load interest evolution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChartOption = () => {
    if (!chartData || chartData.series.length === 0) {
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
        text: '兴趣演化河流图',
        subtext: '展示不同标签权重随时间的变化',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      legend: {
        data: chartData.tags,
        top: 40,
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
        data: chartData.months,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '标签权重',
      },
      series: chartData.series.map((s, idx) => ({
        name: s.name,
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: COLORS[idx % COLORS.length],
        },
        emphasis: {
          focus: 'series',
        },
        data: s.data,
      })),
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          兴趣演化分析
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
        <ReactECharts option={getChartOption()} style={{ height: 500 }} />
      </Card>

      <Card title="图表说明" style={{ marginTop: 24 }}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>X轴（时间）</strong>
            ：表示借阅发生的月份
          </li>
          <li>
            <strong>Y轴（标签权重）</strong>
            ：表示该标签在对应月份的累计权重，考虑了时间衰减因素
          </li>
          <li>
            <strong>河流区域</strong>
            ：不同颜色代表不同的标签，区域高度表示该标签的权重大小
          </li>
          <li>
            <strong>时间衰减</strong>
            ：越早的借阅记录权重越低，越新的借阅记录权重越高
          </li>
        </ul>
      </Card>
    </div>
  )
}

export default InterestEvolution
