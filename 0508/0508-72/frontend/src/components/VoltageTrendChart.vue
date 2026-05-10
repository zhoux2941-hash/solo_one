<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  dailyData: {
    type: Object,
    required: true
  },
  batteryIds: {
    type: Array,
    required: true
  }
})

const chartRef = ref(null)
let chart = null

const batteryColors = {
  'B1': '#52c41a',
  'B2': '#1890ff',
  'B3': '#faad14',
  'B4': '#f5222d'
}

const getOption = () => {
  const days = []
  const firstBattery = props.batteryIds[0]
  if (props.dailyData[firstBattery] && props.dailyData[firstBattery].length > 0) {
    for (let i = 0; i < props.dailyData[firstBattery].length; i++) {
      days.push(`第${i + 1}天`)
    }
  }

  const series = props.batteryIds.map(batteryId => {
    const data = props.dailyData[batteryId] || []
    return {
      name: batteryId,
      type: 'line',
      data: data.map(d => d.voltage),
      smooth: true,
      lineStyle: {
        width: 3,
        color: batteryColors[batteryId]
      },
      itemStyle: {
        color: batteryColors[batteryId]
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: batteryColors[batteryId] + '40' },
          { offset: 1, color: batteryColors[batteryId] + '10' }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      endLabel: {
        show: true,
        formatter: '{c}V',
        fontWeight: 'bold',
        fontSize: 12
      },
      label: {
        show: false,
        formatter: '{c}V'
      },
      markPoint: {
        data: [
          { type: 'max', name: '最高' },
          { type: 'min', name: '最低' }
        ]
      }
    }
  })

  return {
    title: {
      text: '电池电压变化趋势（骑行后）',
      subtext: '单位: V',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let result = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach(param => {
          const color = param.color
          result += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`
          result += `${param.seriesName}: <strong>${param.value}V</strong><br/>`
        })
        return result
      }
    },
    legend: {
      data: props.batteryIds,
      top: 35
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      min: 2.8,
      max: 4.4,
      interval: 0.2,
      axisLabel: {
        formatter: '{value}V',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: series
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

watch(() => [props.dailyData, props.batteryIds], () => {
  updateChart()
}, { deep: true })

onUnmounted(() => {
  chart?.dispose()
})
</script>