import { useState, useEffect } from 'react'
import { Card, Table, Tag, Progress, Typography } from 'antd'
import { TrendingUpOutlined, TrendingDownOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { analysisApi } from '../services/api'
import type { TrendingTag } from '../types'

const { Title, Text } = Typography

function TrendingTags() {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await analysisApi.getTrendingTags(20)
      setTrendingTags(response.data.data)
    } catch (error) {
      console.error('Failed to load trending tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return <TrendingUpOutlined style={{ color: '#52c41a' }} />
    } else if (growthRate < 0) {
      return <TrendingDownOutlined style={{ color: '#ff4d4f' }} />
    }
    return null
  }

  const getChartOption = () => {
    if (trendingTags.length === 0) {
      return {
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
        },
      }
    }

    const topTags = trendingTags.slice(0, 10)

    return {
      title: {
        text: '热门标签增长趋势',
        subtext: '环比增长率（本月 vs 上月）',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const data = params[0]
          const tag = trendingTags.find((t) => t.tag === data.name)
          if (!tag) return data.name
          return `
            <strong>${data.name}</strong><br/>
            增长率: ${tag.growthRate.toFixed(1)}%<br/>
            本月借阅: ${tag.currentMonthCount}<br/>
            上月借阅: ${tag.previousMonthCount}
          `
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
        data: topTags.map((t) => t.tag),
        axisLabel: {
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        name: '增长率(%)',
      },
      series: [
        {
          type: 'bar',
          data: topTags.map((t) => ({
            value: t.growthRate,
            itemStyle: {
              color: t.growthRate >= 0 ? '#52c41a' : '#ff4d4f',
            },
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
          },
          barWidth: '60%',
        },
      ],
    }
  }

  const columns = [
    {
      title: '标签',
      dataIndex: 'tag',
      key: 'tag',
      render: (text: string) => <Tag color="blue" style={{ fontSize: 14 }}>{text}</Tag>,
    },
    {
      title: '本月借阅',
      dataIndex: 'currentMonthCount',
      key: 'currentMonthCount',
      sorter: (a: TrendingTag, b: TrendingTag) => a.currentMonthCount - b.currentMonthCount,
    },
    {
      title: '上月借阅',
      dataIndex: 'previousMonthCount',
      key: 'previousMonthCount',
      sorter: (a: TrendingTag, b: TrendingTag) => a.previousMonthCount - b.previousMonthCount,
    },
    {
      title: '增长率',
      dataIndex: 'growthRate',
      key: 'growthRate',
      sorter: (a: TrendingTag, b: TrendingTag) => a.growthRate - b.growthRate,
      render: (value: number, record: TrendingTag) => (
        <span>
          {getGrowthIcon(value)}
          <span style={{ marginLeft: 8, color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {value.toFixed(1)}%
          </span>
        </span>
      ),
    },
    {
      title: '趋势可视化',
      key: 'trend',
      render: (_: any, record: TrendingTag) => {
        const maxGrowth = Math.max(...trendingTags.map((t) => Math.abs(t.growthRate)))
        const percent = maxGrowth === 0 ? 0 : (Math.abs(record.growthRate) / maxGrowth) * 100
        return (
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={record.growthRate >= 0 ? '#52c41a' : '#ff4d4f'}
            style={{ width: 120 }}
          />
        )
      },
    },
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        群体兴趣趋势分析
      </Title>

      <Card loading={loading} style={{ marginBottom: 24 }}>
        <ReactECharts option={getChartOption()} style={{ height: 400 }} />
      </Card>

      <Card title="热门标签详情" loading={loading}>
        <Table
          columns={columns}
          dataSource={trendingTags}
          rowKey="tag"
          pagination={false}
        />
      </Card>

      <Card title="分析说明" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>环比增长率</strong>
            ：计算方式为 (本月借阅量 - 上月借阅量) / 上月借阅量 * 100%
          </p>
          <p>
            <strong>数据说明</strong>
            ：
          </p>
          <ul style={{ marginLeft: 20 }}>
            <li>正数表示相比上月借阅量有所增长</li>
            <li>负数表示相比上月借阅量有所下降</li>
            <li>增长率超过100%说明该标签本月借阅量是上月的2倍以上</li>
          </ul>
          <p>
            <strong>应用价值</strong>
            ：
          </p>
          <ul style={{ marginLeft: 20 }}>
            <li>发现当前热门的阅读兴趣点</li>
            <li>预测未来可能流行的书籍类型</li>
            <li>为采购和馆藏调整提供依据</li>
            <li>结合读者个人兴趣，实现精准推荐</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default TrendingTags
