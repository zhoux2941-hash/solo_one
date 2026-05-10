<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  batteryResults: {
    type: Array,
    required: true
  }
})

const chartRef = ref(null)
let chart = null

const getOption = () => {
  const batteryIds = props.batteryResults.map(b => b.batteryId)
  const initialData = props.batteryResults.map(b => b.initialBattery)
  const remainingData = props.batteryResults.map(b => b.remainingBattery)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['初始电量', '剩余电量'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: batteryIds,
      axisLabel: {
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '初始电量',
        type: 'bar',
        data: initialData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '剩余电量',
        type: 'bar',
        data: remainingData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f093fb' },
            { offset: 1, color: '#f5576c' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontWeight: 'bold',
          fontSize: 14,
          color: '#333'
        }
      }
    ]
  }
}

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    chart.setOption(getOption())
  }
}

const updateChart = () => {
  if (chart) {
    chart.setOption(getOption())
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

watch(() => props.batteryResults, () => {
  updateChart()
}, { deep: true })

onUnmounted(() => {
  chart?.dispose()
})
</script>