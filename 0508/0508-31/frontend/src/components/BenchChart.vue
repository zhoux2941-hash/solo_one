<template>
  <div>
    <h2 class="chart-title">📊 长椅阳光阴影时段对比图</h2>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  stats: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !props.stats || props.stats.length === 0) return

  const benchNames = props.stats.map(s => s.benchName)
  const sunData = props.stats.map(s => s.sunDurationMinutes)
  const shadowData = props.stats.map(s => s.shadowPercentage)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = `<div style="font-weight:bold;margin-bottom:8px;">${params[0].name}</div>`
        params.forEach(param => {
          const unit = param.seriesName === '阳光时长' ? ' 分钟' : '%'
          result += `<div style="display:flex;align-items:center;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:${param.color};"></span>
            ${param.seriesName}: ${param.value}${unit}
          </div>`
        })
        return result
      }
    },
    legend: {
      data: ['阳光时长', '阴影占比'],
      top: 10,
      textStyle: {
        fontSize: 14
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: benchNames,
      axisLabel: {
        rotate: 15,
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '阳光时长(分钟)',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#FF6B6B'
          }
        },
        axisLabel: {
          color: '#FF6B6B'
        },
        nameTextStyle: {
          color: '#FF6B6B',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#eee'
          }
        }
      },
      {
        type: 'value',
        name: '阴影占比(%)',
        position: 'right',
        min: 0,
        max: 100,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#4ECDC4'
          }
        },
        axisLabel: {
          color: '#4ECDC4',
          formatter: '{value}%'
        },
        nameTextStyle: {
          color: '#4ECDC4',
          fontSize: 12
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '阳光时长',
        type: 'bar',
        data: sunData,
        barWidth: '30%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#FF6B6B' },
            { offset: 1, color: '#FF8E8E' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF5252' },
              { offset: 1, color: '#FF7070' }
            ])
          }
        }
      },
      {
        name: '阴影占比',
        type: 'bar',
        yAxisIndex: 1,
        data: shadowData,
        barWidth: '30%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4ECDC4' },
            { offset: 1, color: '#7EDDD6' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#26A69A' },
              { offset: 1, color: '#4ECDC4' }
            ])
          }
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

watch(() => props.stats, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.chart {
  width: 100%;
  height: 500px;
}
</style>
