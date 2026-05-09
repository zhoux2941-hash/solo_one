<template>
  <div class="analytics-view">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>今日客流</h3>
        <div class="value">{{ stats.totalQueues }}</div>
      </div>
      <div class="stat-card">
        <h3>平均等待</h3>
        <div class="value">{{ stats.avgWait }} 分</div>
      </div>
      <div class="stat-card">
        <h3>2人桌翻台</h3>
        <div class="value">{{ stats.smallTurnover.toFixed(1) }}</div>
      </div>
      <div class="stat-card">
        <h3>4人桌翻台</h3>
        <div class="value">{{ stats.mediumTurnover.toFixed(1) }}</div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>📊 客流热力图（最近{{ days }}天）</h2>
        <div>
          <button 
            class="btn" 
            :class="days === 1 ? 'btn-primary' : 'btn-warning'" 
            @click="days = 1"
            style="padding: 8px 16px;"
          >
            今天
          </button>
          <button 
            class="btn" 
            :class="days === 7 ? 'btn-primary' : 'btn-warning'" 
            @click="days = 7"
            style="padding: 8px 16px; margin-left: 8px;"
          >
            一周
          </button>
        </div>
      </div>
      <div ref="trafficChartRef" class="chart-container"></div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>📈 翻台率统计（最近{{ hours }}小时）</h2>
        <div>
          <button 
            class="btn" 
            :class="hours === 6 ? 'btn-primary' : 'btn-warning'" 
            @click="hours = 6"
            style="padding: 8px 16px;"
          >
            6小时
          </button>
          <button 
            class="btn" 
            :class="hours === 24 ? 'btn-primary' : 'btn-warning'" 
            @click="hours = 24"
            style="padding: 8px 16px; margin-left: 8px;"
          >
            24小时
          </button>
        </div>
      </div>
      <div ref="turnoverChartRef" class="chart-container"></div>
    </div>

    <div class="card">
      <h2>📋 桌位类型对比</h2>
      <div ref="tableCompareRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { analyticsApi } from '../api'

const days = ref(7)
const hours = ref(24)
const trafficChartRef = ref(null)
const turnoverChartRef = ref(null)
const tableCompareRef = ref(null)
const stats = ref({
  totalQueues: 0,
  avgWait: 0,
  smallTurnover: 0,
  mediumTurnover: 0
})

let trafficChart = null
let turnoverChart = null
let tableCompareChart = null

const loadTrafficData = async () => {
  try {
    const res = await analyticsApi.getTraffic(days.value)
    renderTrafficChart(res.data)
    
    const hourlyData = res.data.hourlyData || []
    stats.value.totalQueues = hourlyData.reduce((sum, h) => sum + (h.queueCount || 0), 0)
    
    const waitData = hourlyData.filter(h => h.avgWaitMinutes > 0)
    if (waitData.length > 0) {
      stats.value.avgWait = Math.round(
        waitData.reduce((sum, h) => sum + h.avgWaitMinutes, 0) / waitData.length
      )
    }
  } catch (e) {
    console.error('加载客流数据失败', e)
  }
}

const loadTurnoverData = async () => {
  try {
    const res = await analyticsApi.getTurnover(hours.value)
    renderTurnoverChart(res.data)
    renderTableCompareChart(res.data)
    
    const tableStats = res.data.tableTypeStats || {}
    stats.value.smallTurnover = tableStats.small?.turnoverRate || 0
    stats.value.mediumTurnover = tableStats.medium?.turnoverRate || 0
  } catch (e) {
    console.error('加载翻台数据失败', e)
  }
}

const renderTrafficChart = (data) => {
  if (!trafficChartRef.value) return
  
  if (!trafficChart) {
    trafficChart = echarts.init(trafficChartRef.value)
  }

  const hourlyData = data.hourlyData || []
  const hours = hourlyData.map(d => `${d.hour}:00`)
  const queueCounts = hourlyData.map(d => d.queueCount || 0)
  const avgWaits = hourlyData.map(d => d.avgWaitMinutes || 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['取号数量', '平均等待时长'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        interval: 2,
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '取号数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '等待时长(分)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '取号数量',
        type: 'bar',
        data: queueCounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      },
      {
        name: '平均等待时长',
        type: 'line',
        yAxisIndex: 1,
        data: avgWaits,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#f5576c'
        },
        itemStyle: {
          color: '#f5576c'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
          ])
        }
      }
    ]
  }

  trafficChart.setOption(option)
}

const renderTurnoverChart = (data) => {
  if (!turnoverChartRef.value) return
  
  if (!turnoverChart) {
    turnoverChart = echarts.init(turnoverChartRef.value)
  }

  const hourlyTurnover = data.hourlyTurnover || []
  const hours = hourlyTurnover.map(d => `${d.hour}:00`)
  const completed = hourlyTurnover.map(d => d.completedCount || 0)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '完成桌数'
    },
    series: [
      {
        name: '每小时完成',
        type: 'bar',
        data: completed,
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#11998e' },
            { offset: 1, color: '#38ef7d' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  turnoverChart.setOption(option)
}

const renderTableCompareChart = (data) => {
  if (!tableCompareRef.value) return
  
  if (!tableCompareChart) {
    tableCompareChart = echarts.init(tableCompareRef.value)
  }

  const tableStats = data.tableTypeStats || {}
  const small = tableStats.small || {}
  const medium = tableStats.medium || {}

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['桌位数', '已完成订单', '翻台率(张/桌/天)'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['2人桌', '4人桌']
    },
    yAxis: [
      {
        type: 'value',
        name: '数量'
      },
      {
        type: 'value',
        name: '翻台率',
        position: 'right'
      }
    ],
    series: [
      {
        name: '桌位数',
        type: 'bar',
        data: [small.tableCount || 0, medium.tableCount || 0],
        itemStyle: { color: '#667eea' }
      },
      {
        name: '已完成订单',
        type: 'bar',
        data: [small.completedOrders || 0, medium.completedOrders || 0],
        itemStyle: { color: '#764ba2' }
      },
      {
        name: '翻台率(张/桌/天)',
        type: 'line',
        yAxisIndex: 1,
        data: [
          (small.turnoverRate || 0).toFixed(2),
          (medium.turnoverRate || 0).toFixed(2)
        ],
        smooth: true,
        lineStyle: { width: 3, color: '#f5576c' },
        itemStyle: { color: '#f5576c' }
      }
    ]
  }

  tableCompareChart.setOption(option)
}

const handleResize = () => {
  trafficChart?.resize()
  turnoverChart?.resize()
  tableCompareChart?.resize()
}

watch(days, () => {
  nextTick(() => loadTrafficData())
})

watch(hours, () => {
  nextTick(() => loadTurnoverData())
})

onMounted(() => {
  loadTrafficData()
  loadTurnoverData()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  trafficChart?.dispose()
  turnoverChart?.dispose()
  tableCompareChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.analytics-view {
}
</style>
