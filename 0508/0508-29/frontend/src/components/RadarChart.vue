<template>
  <div class="radar-chart-container">
    <div ref="chartRef" class="radar-chart"></div>
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

const formatData = (lanes) => {
  const indicators = lanes.map(lane => ({
    name: lane.laneName,
    max: 100
  }))
  const values = lanes.map(lane => lane.toleranceValue)
  const shallowValues = lanes
    .filter(lane => lane.zone === 'shallower')
    .map(lane => lane.toleranceValue)
  const deepValues = lanes
    .filter(lane => lane.zone === 'deeper')
    .map(lane => lane.toleranceValue)

  return {
    indicators,
    allValues: values,
    shallowValues,
    deepValues
  }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const getDefaultOption = () => ({
  title: {
    text: '泳道拥挤容忍度指数',
    left: 'center',
    top: 10,
    textStyle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    data: ['所有泳道'],
    bottom: 10,
    textStyle: {
      color: '#fff'
    }
  },
  radar: {
    indicator: [],
    shape: 'polygon',
    splitNumber: 5,
    axisName: {
      color: '#fff',
      fontSize: 12
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.2)'
      }
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: [
          'rgba(102, 126, 234, 0.1)',
          'rgba(102, 126, 234, 0.2)',
          'rgba(102, 126, 234, 0.3)',
          'rgba(102, 126, 234, 0.4)',
          'rgba(102, 126, 234, 0.5)'
        ]
      }
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.4)'
      }
    }
  },
  series: [
    {
      name: '拥挤容忍度指数',
      type: 'radar',
      data: []
    }
  ]
})

const updateChart = () => {
  if (!chartInstance) return

  const option = getDefaultOption()

  if (props.data.length > 0) {
    const { indicators, allValues } = formatData(props.data)

    option.radar.indicator = indicators
    option.tooltip.formatter = (params) => {
      let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>`
      params.data.forEach((value, index) => {
        result += `<div>${indicators[index].name}: ${value}</div>`
      })
      return result
    }
    option.series[0].data = [
      {
        value: allValues,
        name: '所有泳道',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 2,
          color: '#ff6b6b'
        },
        areaStyle: {
          color: 'rgba(255, 107, 107, 0.4)'
        },
        itemStyle: {
          color: '#ff6b6b'
        }
      }
    ]
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
  initChart()
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
.radar-chart-container {
  width: 100%;
  height: 500px;
}

.radar-chart {
  width: 100%;
  height: 100%;
}
</style>
