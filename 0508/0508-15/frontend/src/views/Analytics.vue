<template>
  <div>
    <div class="card analytics-section">
      <h3 class="card-title">📊 骑手历史准时率折线图（近7天）</h3>
      <div ref="rateChartRef" class="chart-container"></div>
    </div>

    <div class="card">
      <h3 class="card-title">📦 订单配送时长箱线图（按时间段）</h3>
      <div ref="boxChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const rateChartRef = ref(null)
const boxChartRef = ref(null)

let rateChart = null
let boxChart = null

const initRateChart = (data) => {
  if (!rateChartRef.value) return

  rateChart = echarts.init(rateChartRef.value)

  const riderNames = Object.keys(data)
  const dates = riderNames.length > 0 
    ? data[riderNames[0]].map(d => {
        const date = new Date(d.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })
    : []

  const series = riderNames.map(name => ({
    name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    data: data[name].map(d => d.rate.toFixed(1)),
    lineStyle: {
      width: 2
    }
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}%'
    },
    legend: {
      data: riderNames,
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 70,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '准时率 (%)',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series
  }

  rateChart.setOption(option)
}

const initBoxPlotChart = (data) => {
  if (!boxChartRef.value) return

  boxChart = echarts.init(boxChartRef.value)

  const xData = data.map(d => d.timeSlot)
  const boxData = data.map(d => [
    d.min,
    d.q1,
    d.median,
    d.q3,
    d.max
  ])

  const outlierData = []
  data.forEach((slot, idx) => {
    slot.durations.forEach(duration => {
      if (duration < slot.min || duration > slot.max) {
        outlierData.push([idx, duration])
      }
    })
  })

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        if (params.seriesType === 'boxplot') {
          return [
            params.name + '<br/>',
            '上限: ' + params.data[4] + ' 分钟<br/>',
            'Q3: ' + params.data[3] + ' 分钟<br/>',
            '中位数: ' + params.data[2] + ' 分钟<br/>',
            'Q1: ' + params.data[1] + ' 分钟<br/>',
            '下限: ' + params.data[0] + ' 分钟'
          ].join('')
        }
        return params.name + ': ' + params.data[1] + ' 分钟'
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: true,
      axisLabel: {
        interval: 0,
        rotate: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '配送时长（分钟）',
      min: 0
    },
    series: [
      {
        name: '箱线图',
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: '#667eea',
          borderColor: '#667eea'
        }
      },
      {
        name: '异常值',
        type: 'scatter',
        data: outlierData,
        itemStyle: {
          color: '#dc3545'
        }
      }
    ]
  }

  boxChart.setOption(option)
}

const loadMockData = () => {
  const riders = ['张三', '李四', '王五', '赵六', '钱七']
  const mockData = {}
  const today = new Date()

  riders.forEach(name => {
    mockData[name] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      mockData[name].push({
        date: date.toISOString().split('T')[0],
        rate: 70 + Math.random() * 30
      })
    }
  })

  const mockBoxData = [
    {
      timeSlot: '上午 (8-12)',
      durations: [15, 18, 22, 25, 28, 30, 35, 40],
      min: 15,
      q1: 20,
      median: 26,
      q3: 32,
      max: 40
    },
    {
      timeSlot: '下午 (12-18)',
      durations: [12, 15, 18, 20, 22, 25, 30, 38],
      min: 12,
      q1: 17,
      median: 21,
      q3: 28,
      max: 38
    },
    {
      timeSlot: '晚上 (18-22)',
      durations: [20, 25, 28, 32, 35, 40, 45, 55],
      min: 20,
      q1: 26,
      median: 33,
      q3: 42,
      max: 55
    },
    {
      timeSlot: '夜间 (22-8)',
      durations: [18, 22, 25, 30, 35, 42, 50, 60],
      min: 18,
      q1: 23,
      median: 32,
      q3: 46,
      max: 60
    }
  ]

  return { mockData, mockBoxData }
}

const fetchData = async () => {
  try {
    const [rateResponse, boxResponse] = await Promise.all([
      axios.get('/api/analytics/on-time-rate?days=7'),
      axios.get('/api/analytics/delivery-time-boxplot?days=7')
    ])

    const rateData = rateResponse.data
    const boxData = boxResponse.data

    const hasRateData = Object.values(rateData).some(arr => arr.some(item => item.rate > 0))
    const hasBoxData = boxData.some(slot => slot.durations.length > 0)

    if (!hasRateData || !hasBoxData) {
      const { mockData, mockBoxData } = loadMockData()
      initRateChart(hasRateData ? rateData : mockData)
      initBoxPlotChart(hasBoxData ? boxData : mockBoxData)
    } else {
      initRateChart(rateData)
      initBoxPlotChart(boxData)
    }
  } catch (error) {
    console.error('Failed to fetch analytics data:', error)
    const { mockData, mockBoxData } = loadMockData()
    initRateChart(mockData)
    initBoxPlotChart(mockBoxData)
  }
}

const handleResize = () => {
  rateChart?.resize()
  boxChart?.resize()
}

onMounted(async () => {
  await nextTick()
  await fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  rateChart?.dispose()
  boxChart?.dispose()
})
</script>
