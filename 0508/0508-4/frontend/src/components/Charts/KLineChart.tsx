import { useEffect, useState, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { useStockStore } from '../../store/stockStore'
import { useWebSocketStore } from '../../store/websocketStore'
import { stockAPI } from '../../services/api'
import type { KLineData, MovingAverage } from '../../types'
import { calculateMA } from '../../utils/chartUtils'

const MARKET_TYPES = ['day', 'week', 'month'] as const
const MA_TYPES: MovingAverage[] = [5, 10, 20, 30]
const MA_COLORS: Record<MovingAverage, string> = {
  5: '#DB5B66',
  10: '#F5A623',
  20: '#7ED321',
  30: '#4A90D9'
}

function KLineChart() {
  const chartRef = useRef<ReactECharts>(null)
  const {
    selectedStock,
    kLineData,
    kLineType,
    maTypes,
    showVolume,
    setKLineData,
    setKLineType,
    toggleMAType,
    setShowVolume
  } = useStockStore()
  const { stockPrices } = useWebSocketStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedStock) {
      loadKLineData()
    }
  }, [selectedStock, kLineType])

  useEffect(() => {
    if (selectedStock && kLineData.length > 0) {
      const liveData = stockPrices[selectedStock.code]
      if (liveData && kLineType === 'day') {
        updateLastKLine(liveData)
      }
    }
  }, [stockPrices, selectedStock, kLineData.length])

  const loadKLineData = async () => {
    if (!selectedStock) return

    setLoading(true)
    try {
      const data = await stockAPI.getKLine(selectedStock.code, kLineType)
      setKLineData(data)
    } catch (error) {
      console.error('Failed to load K-line data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLastKLine = (liveData: any) => {
    setKLineData(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const updated: KLineData = {
        ...last,
        close: liveData.price || last.close,
        high: Math.max(last.high, liveData.price || last.high),
        low: Math.min(last.low, liveData.price || last.low),
        volume: liveData.volume || last.volume
      }
      return [...prev.slice(0, -1), updated]
    })
  }

  const getOption = () => {
    const dates = kLineData.map(d => d.time)
    const ohlc = kLineData.map(d => [d.open, d.close, d.low, d.high])
    const volumes = kLineData.map(d => d.volume)

    const maSeries: echarts.SeriesOption[] = maTypes.map(period => {
      const maData = calculateMA(kLineData, period)
      return {
        name: `MA${period}`,
        type: 'line',
        data: maData,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1,
          color: MA_COLORS[period]
        },
        z: 10
      }
    })

    const series: echarts.SeriesOption[] = [
      {
        name: 'K线',
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: '#ef232a',
          color0: '#14b143',
          borderColor: '#ef232a',
          borderColor0: '#14b143'
        }
      },
      ...maSeries
    ]

    if (showVolume) {
      series.push({
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: (params: any) => {
            const idx = params.dataIndex
            return kLineData[idx].close >= kLineData[idx].open ? '#ef232a' : '#14b143'
          }
        }
      })
    }

    const grid: echarts.GridComponentOption[] = [
      {
        left: '10%',
        right: '8%',
        top: '10%',
        height: showVolume ? '55%' : '70%'
      }
    ]

    const xAxis: echarts.XAXisComponentOption[] = [
      {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#777' } },
        axisLabel: { color: '#999' },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      }
    ]

    const yAxis: echarts.YAXisComponentOption[] = [
      {
        scale: true,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#777' } },
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#eee' } }
      }
    ]

    if (showVolume) {
      grid.push({
        left: '10%',
        right: '8%',
        top: '72%',
        height: '16%'
      })
      xAxis.push({
        type: 'category',
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#777' } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false }
      })
      yAxis.push({
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { color: '#999' },
        axisLine: { lineStyle: { color: '#777' } },
        splitLine: { show: false }
      })
    }

    return {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#333',
        textStyle: { color: '#fff' }
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: { backgroundColor: '#777' }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: showVolume ? [0, 1] : [0],
          start: 50,
          end: 100
        },
        {
          show: true,
          xAxisIndex: showVolume ? [0, 1] : [0],
          type: 'slider',
          top: '92%',
          start: 50,
          end: 100,
          height: 20,
          borderColor: '#ddd',
          fillerColor: 'rgba(24, 144, 255, 0.2)',
          handleStyle: { color: '#1890ff' }
        }
      ],
      grid,
      xAxis,
      yAxis,
      series
    }
  }

  if (!selectedStock) {
    return (
      <div className="empty-state">
        <p>请选择股票查看K线图</p>
      </div>
    )
  }

  const priceChange = selectedStock.change || 0
  const priceChangePercent = selectedStock.changePercent || 0

  return (
    <>
      <div className="stock-header">
        <div className="stock-title">
          <h2>
            {selectedStock.name}
            <span className={`market-tag ${selectedStock.market}`}>{selectedStock.market.toUpperCase()}</span>
          </h2>
          <span className="code">{selectedStock.code}</span>
        </div>
        <div className="stock-price-info">
          <span className={`current-price ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {selectedStock.price.toFixed(2)}
          </span>
          <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
            ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="chart-toolbar">
        <div className="toolbar-group">
          <label>周期：</label>
          {MARKET_TYPES.map(type => (
            <button
              key={type}
              className={kLineType === type ? 'active' : ''}
              onClick={() => setKLineType(type)}
            >
              {type === 'day' ? '日K' : type === 'week' ? '周K' : '月K'}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <label>均线：</label>
          {MA_TYPES.map(period => (
            <button
              key={period}
              className={maTypes.includes(period) ? 'active' : ''}
              onClick={() => toggleMAType(period)}
              style={maTypes.includes(period) ? { background: MA_COLORS[period], borderColor: MA_COLORS[period] } : {}}
            >
              MA{period}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <button
            className={showVolume ? 'active' : ''}
            onClick={() => setShowVolume(!showVolume)}
          >
            成交量
          </button>
        </div>

        {loading && <span style={{ color: '#999', fontSize: 13 }}>加载中...</span>}
      </div>

      <div className="chart-container">
        <ReactECharts
          ref={chartRef}
          option={getOption()}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </>
  )
}

export default KLineChart
