<template>
  <div>
    <div ref="chartRef" style="width: 100%; height: 350px"></div>
    <div v-if="stats && stats.totalCount > 0" class="price-summary">
      <div class="summary-item">
        <span class="label">近{{ months }}个月成交价</span>
        <span class="count">共 {{ stats.totalCount }} 笔</span>
      </div>
      <div class="summary-item">
        <span class="label">平均价</span>
        <span class="value">¥{{ stats.averagePrice || '-' }}</span>
      </div>
      <div class="summary-item">
        <span class="label">最低价</span>
        <span class="value low">¥{{ stats.minPrice || '-' }}</span>
      </div>
      <div class="summary-item">
        <span class="label">最高价</span>
        <span class="value high">¥{{ stats.maxPrice || '-' }}</span>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="暂无成交价数据" :image-size="80" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getTransactionStats } from '@/api/price'

const props = defineProps({
  seriesName: { type: String, required: true },
  styleName: { type: String, required: true },
  months: { type: Number, default: 3 }
})

const chartRef = ref(null)
let chartInstance = null
const loading = ref(false)
const stats = ref(null)

const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  
  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>均价: ¥${data.value}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' }
    },
    series: [
      {
        name: '均价',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        data: []
      }
    ]
  })
}

const loadData = async () => {
  if (!props.seriesName || !props.styleName) return
  
  loading.value = true
  try {
    const res = await getTransactionStats(props.seriesName, props.styleName, props.months)
    stats.value = res.data
    
    if (chartInstance && res.data && res.data.chartData) {
      const dates = res.data.chartData.map(item => item.date)
      const prices = res.data.chartData.map(item => item.avgPrice)
      
      chartInstance.setOption({
        xAxis: { data: dates },
        series: [{ data: prices }]
      })
    }
  } catch (e) {
    console.error('加载成交价数据失败', e)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(() => [props.seriesName, props.styleName, props.months], () => {
  loadData()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    loadData()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.price-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-item .label {
  font-size: 12px;
  color: #909399;
}
.summary-item .count {
  font-size: 13px;
  color: #606266;
}
.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}
.summary-item .value.low {
  color: #67C23A;
}
.summary-item .value.high {
  color: #F56C6C;
}
</style>
