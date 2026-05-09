<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>材料消耗占比</h3>
      <div class="total-info">
        总消耗: <span class="total-value">{{ data.total || 0 }}</span>
      </div>
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
      total: 0,
      items: []
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
  if (!chartInstance || !props.data.items) return

  const items = props.data.items || []

  const chartData = items.map((item, index) => ({
    value: item.amount,
    name: item.name,
    itemStyle: {
      color: colors[index]
    }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = items.find(i => i.name === params.name)
        return `
          <div style="font-weight:bold;margin-bottom:5px;">${params.name}</div>
          <div>消耗: ${params.value} ${item?.unit || ''}</div>
          <div>占比: ${params.percent}%</div>
        `
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        fontSize: 12
      },
      formatter: (name) => {
        const item = items.find(i => i.name === name)
        if (item) {
          return `${name}  ${item.amount} ${item.unit} (${item.percentage}%)`
        }
        return name
      }
    },
    series: [
      {
        name: '消耗占比',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: (params) => {
              return `${params.name}\n${params.percent}%`
            }
          }
        },
        labelLine: {
          show: false
        },
        data: chartData
      }
    ]
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.total-info {
  font-size: 14px;
  color: #666;
}

.total-value {
  font-weight: 600;
  color: #5470c6;
  font-size: 16px;
  margin-left: 5px;
}

.chart {
  flex: 1;
  min-height: 350px;
}
</style>
