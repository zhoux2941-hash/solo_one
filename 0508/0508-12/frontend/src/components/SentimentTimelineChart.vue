<template>
  <div class="chart-container">
    <h3 class="chart-title">情感时间线</h3>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({ series: [] })
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()

  window.addEventListener('resize', handleResize)
}

const updateChart = () => {
  if (!chartInstance || !props.data?.series?.length) {
    chartInstance?.setOption({
      title: {
        text: '暂无情感数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999', fontSize: 14 }
      }
    })
    return
  }

  const series = props.data.series.map((userSeries) => ({
    name: userSeries.username,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 3,
      color: userSeries.color
    },
    itemStyle: {
      color: userSeries.color
    },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: userSeries.color + '40' },
        { offset: 1, color: userSeries.color + '05' }
      ])
    },
    data: userSeries.points.map((point) => ({
      value: [point.timestamp, point.score],
      emotion: point.emotion
    }))
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = params[0].axisValueLabel + '<br/>'
        params.forEach((param) => {
          const emotion = param.data.emotion
          const emotionText = {
            'POSITIVE': '😊 积极',
            'NEGATIVE': '😢 消极',
            'NEUTRAL': '😐 中立'
          }[emotion] || emotion
          result += `${param.marker}${param.seriesName}: ${param.value[1].toFixed(2)} (${emotionText})<br/>`
        })
        return result
      }
    },
    legend: {
      data: props.data.series.map((s) => s.username),
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value)
          return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
        }
      }
    },
    yAxis: {
      type: 'value',
      min: -1,
      max: 1,
      axisLabel: {
        formatter: (value) => value.toFixed(1)
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      },
      markLine: {
        silent: true,
        data: [
          { yAxis: 0, lineStyle: { color: '#999', type: 'dashed' } }
        ]
      }
    },
    series
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
