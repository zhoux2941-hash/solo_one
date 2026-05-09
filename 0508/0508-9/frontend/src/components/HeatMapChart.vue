<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  xAxis: {
    type: Array,
    default: () => []
  },
  yAxis: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
let chartInstance = null

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  chartInstance?.resize()
}

function updateChart() {
  if (!chartInstance) return
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: function(params) {
        return `${props.yAxis[params.value[1]]} - ${props.xAxis[params.value[0]]}<br/>次数: ${params.value[2]}`
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '15%',
      top: '5%'
    },
    xAxis: {
      type: 'category',
      data: props.xAxis,
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: 45,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'category',
      data: props.yAxis,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontSize: 12
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      }
    },
    series: [{
      name: '作弊次数',
      type: 'heatmap',
      data: props.data,
      label: {
        show: true,
        fontSize: 10
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  chartInstance.setOption(option)
}

watch([() => props.xAxis, () => props.yAxis, () => props.data], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
