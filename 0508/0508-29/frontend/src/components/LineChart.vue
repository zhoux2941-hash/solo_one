<template>
  <div class="line-chart-container">
    <div ref="chartRef" class="line-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
let chartInstance = null

const getDefaultOption = () => ({
  title: {
    text: '泳池平均容忍度变化趋势',
    left: 'center',
    top: 10,
    textStyle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const data = params[0]
      return `<div style="font-weight: bold; margin-bottom: 5px;">${data.name}</div>
              <div>平均容忍度: ${data.value.toFixed(1)}</div>`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.6)'
      }
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 11
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.15)'
      }
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.6)'
      }
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.9)'
    }
  },
  series: [
    {
      name: '平均容忍度',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: '#4c6ef5'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(76, 110, 245, 0.5)' },
          { offset: 1, color: 'rgba(76, 110, 245, 0.1)' }
        ])
      },
      itemStyle: {
        color: '#4c6ef5',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: []
    }
  ]
})

const updateChart = () => {
  if (!chartInstance) return

  const option = getDefaultOption()

  if (props.data.length > 0) {
    option.xAxis.data = props.data.map(item => item.recordDate)
    option.series[0].data = props.data.map(item => item.averageTolerance)
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 350px;
}

.line-chart {
  width: 100%;
  height: 100%;
}
</style>
