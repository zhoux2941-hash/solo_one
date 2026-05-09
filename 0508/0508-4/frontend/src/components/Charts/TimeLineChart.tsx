import { useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useStockStore } from '../../store/stockStore'
import { useWebSocketStore } from '../../store/websocketStore'
import { stockAPI } from '../../services/api'
import type { TimeLineData } from '../../types'

function TimeLineChart() {
  const chartRef = useRef<ReactECharts>(null)
  const { selectedStock, timeLineData, setTimeLineData } = useStockStore()
  const { stockPrices } = useWebSocketStore()
  const [loading, setLoading] = useState(false)
  const [showChart, setShowChart] = useState(false)

  useEffect(() => {
    if (selectedStock) {
      loadTimeLineData()
    }
  }, [selectedStock])

  useEffect(() => {
    if (selectedStock && timeLineData.length > 0) {
      const liveData = stockPrices[selectedStock.code]
      if (liveData) {
        updateLastTimeLine(liveData)
      }
    }
  }, [stockPrices, selectedStock])

  const loadTimeLineData = async () => {
    if (!selectedStock) return

    setLoading(true)
    try {
      const data = await stockAPI.getTimeLine(selectedStock.code)
      setTimeLineData(data)
      setShowChart(true)
    } catch (error) {
      console.error('Failed to load timeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLastTimeLine = (liveData: any) => {
    setTimeLineData(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const updated: TimeLineData = {
        ...last,
        time: timeStr,
        price: liveData.price || last.price,
        volume: liveData.volume || last.volume,
        amount: liveData.amount || last.amount
      }
      
      return [...prev.slice(0, -1), updated]
    })
  }

  const getOption = () => {
    if (timeLineData.length === 0) {
      return {
        title: {
          text: loading ? '加载中...' : '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#999', fontSize: 14 }
        }
      }
    }

    const times = timeLineData.map(d => d.time)
    const prices = timeLineData.map(d => d.price)
    const avgPrices = timeLineData.map(d => d.avgPrice)
    const volumes = timeLineData.map(d => d.volume)
    const preClose = timeLineData[0].preClose

    const percentData = timeLineData.map(d => 
      ((d.price - preClose) / preClose * 100).toFixed(2)
    )

    const maxPercent = Math.max(...percentData.map(Number))
    const minPercent = Math.min(...percentData.map(Number))
    const yMax = Math.max(maxPercent, 10)
    const yMin = Math.min(minPercent, -10)

    return {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const data = params[0]
          if (!data) return ''
          const price = data.value
          const percent = ((price - preClose) / preClose * 100).toFixed(2)
          return `
            <div style="padding: 4px 8px;">
              <div style="marginBottom: 4px;">${data.axisValue}</div>
              <div>价格: <span style="color: ${price >= preClose ? '#f5222d' : '#52c41a'}">${price.toFixed(2)}</span></div>
              <div>涨跌幅: <span style="color: ${Number(percent) >= 0 ? '#f5222d' : '#52c41a'}">${Number(percent) >= 0 ? '+' : ''}${percent}%</span></div>
            </div>
          `
        }
      },
      grid: [
        {
          left: '6%',
          right: '4%',
          top: '10%',
          height: '50%'
        },
        {
          left: '6%',
          right: '4%',
          top: '70%',
          height: '20%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: times,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#ddd' } },
          axisLabel: { color: '#999', interval: Math.floor(times.length / 6) },
          splitLine: { show: false }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: times,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#ddd' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false }
        }
      ],
      yAxis: [
        {
          type: 'value',
          scale: true,
          position: 'right',
          min: yMin,
          max: yMax,
          splitNumber: 4,
          axisLine: { show: false },
          axisLabel: {
            color: '#999',
            formatter: (val: number) => val.toFixed(2) + '%'
          },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        {
          type: 'value',
          scale: true,
          position: 'left',
          splitNumber: 4,
          axisLine: { show: false },
          axisLabel: { color: '#999' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          gridIndex: 1,
          scale: true,
          splitNumber: 2,
          axisLine: { show: false },
          axisLabel: { color: '#999', formatter: (val: number) => (val / 10000).toFixed(0) + '万' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '价格',
          type: 'line',
          data: prices,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
              ]
            }
          }
        },
        {
          name: '均价',
          type: 'line',
          data: avgPrices,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: '#faad14', type: 'dashed' }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 2,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex
              const prevPrice = idx > 0 ? prices[idx - 1] : preClose
              return prices[idx] >= prevPrice ? '#ef232a' : '#14b143'
            }
          }
        }
      ],
      markLine: {
        symbol: 'none',
        data: [
          {
            yAxis: 0,
            lineStyle: { color: '#999', type: 'dashed' },
            label: { formatter: '昨收: ' + preClose.toFixed(2), position: 'end' }
          }
        ]
      }
    }
  }

  if (!selectedStock || !showChart) {
    return null
  }

  return (
    <div style={{ height: 300, background: 'white', borderBottom: '1px solid #e8e8e8' }}>
      <div style={{ padding: '8px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600 }}>分时图</h4>
        {loading && <span style={{ color: '#999', fontSize: 12 }}>加载中...</span>}
      </div>
      <div style={{ height: 'calc(100% - 40px)', padding: '0 8px' }}>
        <ReactECharts
          ref={chartRef}
          option={getOption()}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  )
}

export default TimeLineChart
