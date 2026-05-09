<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({})
  },
  machineColors: {
    type: Object,
    default: () => ({
      C1: '#00d4ff',
      C2: '#22c55e',
      C3: '#ef4444',
      C4: '#a855f7'
    })
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

const handleResize = () => {
  chartInstance?.resize()
}

const updateChart = () => {
  if (!chartInstance) return

  const machines = Object.keys(props.chartData)
  if (machines.length === 0) {
    chartInstance.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#8892b0',
          fontSize: 16
        }
      }
    })
    return
  }

  const allTimes = new Set()
  machines.forEach(machineId => {
    props.chartData[machineId].forEach(record => {
      allTimes.add(record.recordTime)
    })
  })

  const timeLabels = Array.from(allTimes).sort()

  const series = machines.map(machineId => {
    const records = props.chartData[machineId]
    const recordMap = new Map(records.map(r => [r.recordTime, r.concentration]))

    const data = timeLabels.map(time => recordMap.get(time) ?? null)

    return {
      name: machineId,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: props.machineColors[machineId] || '#888'
      },
      emphasis: {
        focus: 'series'
      },
      data
    }
  })

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: {
        color: '#e8e8e8'
      },
      formatter: (params) => {
        let html = `<div style="font-weight: 600; margin-bottom: 8px;">${formatTime(params[0].axisValue)}</div>`
        params.forEach(p => {
          const color = p.color
          const value = p.value !== null ? p.value.toFixed(2) + '%' : '--'
          const status = getStatusColor(p.value)
          html += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color}; margin-right: 8px;"></span>
            <span style="font-weight: 500;">${p.seriesName}:</span>
            <span style="color: ${status}; margin-left: 6px;">${value}</span>
          </div>`
        })
        return html
      }
    },
    legend: {
      data: machines,
      top: 0,
      right: 0,
      textStyle: {
        color: '#e8e8e8'
      }
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
      boundaryGap: false,
      data: timeLabels.map(t => formatTimeLabel(t)),
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: '#8892b0',
        fontSize: 11,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '浓度 (%)',
      nameTextStyle: {
        color: '#8892b0'
      },
      min: 0,
      max: 10,
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: '#8892b0'
      }
    },
    series,
    markLine: {
      silent: true,
      symbol: 'none',
      data: [
        {
          yAxis: 2,
          lineStyle: {
            color: '#f97316',
            type: 'dashed',
            width: 1
          },
          label: {
            formatter: '下限 2%',
            position: 'start',
            color: '#f97316',
            fontSize: 10
          }
        },
        {
          yAxis: 5,
          lineStyle: {
            color: '#f97316',
            type: 'dashed',
            width: 1
          },
          label: {
            formatter: '上限 5%',
            position: 'start',
            color: '#f97316',
            fontSize: 10
          }
        }
      ]
    }
  }

  chartInstance.setOption(option, true)
}

const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatTimeLabel = (timeStr) => {
  const date = new Date(timeStr)
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

const getStatusColor = (value) => {
  if (value === null) return '#8892b0'
  if (value < 2 || value > 5) return '#ef4444'
  return '#22c55e'
}

watch(() => props.chartData, () => {
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
