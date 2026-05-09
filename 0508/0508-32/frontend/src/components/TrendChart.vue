<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>过去 7 天材料消耗趋势</h3>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      dates: [],
      materials: []
    })
  }
})

const chartRef = ref(null)
let chartInstance = null

const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !props.data.dates) return

  const dates = props.data.dates.map(date => {
    const parts = date.split('-')
    return `${parts[1]}/${parts[2]}`
  })

  const series = (props.data.materials || []).map((material, index) => ({
    name: material.name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 3
    },
    itemStyle: {
      color: colors[index]
    },
    data: material.data
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].axisValue}</div>`
        params.forEach(item => {
          const unit = props.data.materials[item.seriesIndex]?.unit || ''
          result += `<div style="display:flex;align-items:center;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:8px;"></span>
            ${item.seriesName}: ${item.value} ${unit}
          </div>`
        })
        return result
      }
    },
    legend: {
      data: (props.data.materials || []).map(m => m.name),
      bottom: 0,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: series
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.chart {
  flex: 1;
  min-height: 350px;
}
</style>
