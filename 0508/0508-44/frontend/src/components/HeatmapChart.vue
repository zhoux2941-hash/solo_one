<template>
  <div class="heatmap-wrapper">
    <div v-if="cacheTime" class="cache-info">
      <span>缓存时间: {{ cacheTime }}</span>
    </div>
    <div class="chart-container" ref="chartRef"></div>
    <div class="legend-container">
      <div class="legend-item">
        <span class="legend-color normal"></span>
        <span class="legend-text">正常 (2%-5%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color mild"></span>
        <span class="legend-text">轻度超标</span>
      </div>
      <div class="legend-item">
        <span class="legend-color severe"></span>
        <span class="legend-text">严重超标</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  heatmapData: {
    type: Object,
    default: () => null
  }
})

const chartRef = ref(null)
const cacheTime = ref('')
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

  if (!props.heatmapData || !props.heatmapData.hours || props.heatmapData.hours.length === 0) {
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

  cacheTime.value = props.heatmapData.cacheTime || ''

  const hours = props.heatmapData.hours
  const machines = props.heatmapData.machines || ['C1', 'C2', 'C3', 'C4']
  const cells = props.heatmapData.data || []

  const seriesData = cells.map(cell => [
    cell.hour,
    cell.machineIndex,
    cell.deviationLevel,
    {
      machineId: cell.machineId,
      concentration: cell.concentration,
      status: cell.status,
      hourLabel: hours[cell.hour]
    }
  ])

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: {
        color: '#e8e8e8'
      },
      formatter: (params) => {
        const data = params.data[3] || {}
        const machineId = data.machineId || machines[params.data[1]]
        const hourLabel = data.hourLabel || hours[params.data[0]]
        const concentration = data.concentration
        const status = data.status

        let statusHtml = ''
        if (concentration < 0) {
          statusHtml = '<span style="color: #8892b0;">无数据</span>'
        } else if (status === 'normal') {
          statusHtml = `<span style="color: #22c55e; font-weight: 600;">正常</span> - ${concentration}%`
        } else if (status === 'mild') {
          statusHtml = `<span style="color: #eab308; font-weight: 600;">轻度超标</span> - ${concentration}%`
        } else {
          statusHtml = `<span style="color: #ef4444; font-weight: 600;">严重超标</span> - ${concentration}%`
        }

        return `<div style="padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 6px;">${machineId} - ${hourLabel}</div>
          <div>${statusHtml}</div>
        </div>`
      }
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '5%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#8892b0',
        fontSize: 10,
        rotate: 45,
        interval: 2
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: machines,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#e8e8e8',
        fontSize: 12,
        fontWeight: 500,
        formatter: (value) => {
          if (value === 'C3') {
            return `{highlight|${value}}`
          }
          return value
        },
        rich: {
          highlight: {
            color: '#ef4444',
            fontWeight: 'bold'
          }
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    visualMap: {
      min: 0,
      max: 2,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      show: false,
      inRange: {
        color: ['#22c55e', '#eab308', '#ef4444']
      },
      outOfRange: {
        color: '#1e293b'
      }
    },
    series: [{
      name: '浓度异常',
      type: 'heatmap',
      data: seriesData,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderRadius: 4,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1
      }
    }]
  }

  chartInstance.setOption(option, true)
}

watch(() => props.heatmapData, () => {
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

<style scoped>
.heatmap-wrapper {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.legend-container {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.normal {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.legend-color.mild {
  background: linear-gradient(135deg, #eab308, #ca8a04);
}

.legend-color.severe {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.legend-text {
  color: #8892b0;
  font-size: 0.85rem;
}

.cache-info {
  text-align: right;
  margin-bottom: 12px;
  font-size: 0.8rem;
  color: #64748b;
}
</style>
