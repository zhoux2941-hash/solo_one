<template>
  <div>
    <h1 class="page-title">时效分析看板</h1>

    <div class="search-bar">
      <el-select v-model="selectedDays" @change="loadData" style="width: 150px;">
        <el-option label="最近7天" :value="7" />
        <el-option label="最近14天" :value="14" />
        <el-option label="最近30天" :value="30" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <div class="card-container">
      <div class="stat-card">
        <div class="stat-card-title">总包裹数</div>
        <div class="stat-card-value">{{ stats.totalPackages }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">平均时效</div>
        <div class="stat-card-value">{{ stats.avgDuration }} 小时</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">最短时效</div>
        <div class="stat-card-value">{{ stats.minDuration }} 小时</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">最长时效</div>
        <div class="stat-card-value">{{ stats.maxDuration }} 小时</div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">📈 日平均时效趋势</div>
      <div ref="lineChartRef" style="height: 350px;"></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">📊 不同线路时效对比</div>
      <div ref="barChartRef" style="height: 400px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import * as echarts from 'echarts'
import { statisticsApi } from '../api'
import { Refresh } from '@element-plus/icons-vue'

const selectedDays = ref(7)
const lineChartRef = ref(null)
const barChartRef = ref(null)
let lineChart = null
let barChart = null

const stats = reactive({
  totalPackages: 0,
  avgDuration: 0,
  minDuration: 0,
  maxDuration: 0
})

const dailyData = ref([])
const routeData = ref([])

const loadData = async () => {
  try {
    const daily = await statisticsApi.getDailyTime(selectedDays.value)
    const route = await statisticsApi.getRouteTime()
    
    dailyData.value = daily || []
    routeData.value = route || []
    
    updateStats()
    updateCharts()
  } catch (error) {
    console.error('加载时效数据失败:', error)
  }
}

const updateStats = () => {
  if (routeData.value.length === 0) {
    stats.totalPackages = 0
    stats.avgDuration = 0
    stats.minDuration = 0
    stats.maxDuration = 0
    return
  }
  
  stats.totalPackages = routeData.value.reduce((sum, r) => sum + r.totalPackages, 0)
  const totalWeighted = routeData.value.reduce((sum, r) => sum + r.averageDurationHours * r.totalPackages, 0)
  stats.avgDuration = Math.round(totalWeighted / stats.totalPackages * 100) / 100
  stats.minDuration = Math.min(...routeData.value.map(r => r.minDurationHours))
  stats.maxDuration = Math.max(...routeData.value.map(r => r.maxDurationHours))
}

const updateCharts = () => {
  updateLineChart()
  updateBarChart()
}

const updateLineChart = () => {
  if (!lineChartRef.value) return
  
  if (!lineChart) {
    lineChart = echarts.init(lineChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>平均时效: {c} 小时'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dailyData.value.map(d => d.date)
    },
    yAxis: {
      type: 'value',
      name: '小时',
      axisLabel: {
        formatter: '{value}h'
      }
    },
    series: [{
      name: '平均时效',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#409EFF'
      },
      lineStyle: {
        width: 3
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      data: dailyData.value.map(d => d.averageDurationHours)
    }]
  }

  lineChart.setOption(option)
}

const updateBarChart = () => {
  if (!barChartRef.value) return
  
  if (!barChart) {
    barChart = echarts.init(barChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0]
        const route = routeData.value[data.dataIndex]
        return `
          ${data.name}<br/>
          包裹数量: ${route.totalPackages} 件<br/>
          平均时效: ${route.averageDurationHours} 小时<br/>
          最短时效: ${route.minDurationHours} 小时<br/>
          最长时效: ${route.maxDurationHours} 小时
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: routeData.value.map(r => r.route),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '小时',
      axisLabel: {
        formatter: '{value}h'
      }
    },
    series: [{
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#67C23A' },
          { offset: 1, color: '#95D476' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      data: routeData.value.map(r => r.averageDurationHours)
    }]
  }

  barChart.setOption(option)
}

const handleResize = () => {
  lineChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  barChart?.dispose()
})
</script>
