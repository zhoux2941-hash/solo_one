<template>
  <div class="page-container">
    <div class="page-title">📊 数据分析中心</div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalCenters }}</div>
            <div class="stat-label">寄养中心</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon><DoorOpened /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalRooms }}</div>
            <div class="stat-label">房间总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalBookings }}</div>
            <div class="stat-label">预约数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon><CloseBold /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.rejectedBookings }}</div>
            <div class="stat-label">拒绝预约</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="analytics-tabs">
      <el-tab-pane label="入住率热力图" name="heatmap">
        <el-card class="card-shadow">
          <div slot="header" class="card-header">
            <span>各房型入住率热力图（{{ selectedYear }}年）</span>
            <el-date-picker
              v-model="selectedYear"
              type="year"
              placeholder="选择年份"
              format="YYYY"
              value-format="YYYY"
              @change="loadHeatmapData"
            />
          </div>
          <div ref="heatmapRef" class="chart-container"></div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="宠物类型偏好" name="preference">
        <el-card class="card-shadow">
          <div slot="header">
            <span>猫狗各房型占比分布</span>
          </div>
          <div ref="preferenceRef" class="chart-container"></div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="冲突分析" name="conflict">
        <el-card class="card-shadow">
          <div slot="header" class="card-header">
            <span>预约冲突分析</span>
            <div>
              <el-date-picker
                v-model="conflictDate"
                type="month"
                placeholder="选择月份"
                value-format="YYYY-MM"
                @change="loadConflictData"
              />
            </div>
          </div>

          <el-row :gutter="20" v-if="conflictData">
            <el-col :span="24">
              <el-alert
                v-if="conflictData.peakDate"
                :title="`高峰日期: ${conflictData.peakDate.date}，共 ${conflictData.peakDate.conflicts} 次冲突`"
                type="warning"
                show-icon
                class="mb-20"
              />
            </el-col>
            <el-col :span="12">
              <h4 class="chart-title">按日期分布</h4>
              <div ref="conflictDateRef" class="chart-container"></div>
            </el-col>
            <el-col :span="12">
              <h4 class="chart-title">按星期分布</h4>
              <div ref="conflictWeekRef" class="chart-container"></div>
            </el-col>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { analyticsApi, centerApi, bookingApi } from '@/api'

const activeTab = ref('heatmap')
const selectedYear = ref(dayjs().format('YYYY'))
const conflictDate = ref(dayjs().format('YYYY-MM'))

const heatmapRef = ref(null)
const preferenceRef = ref(null)
const conflictDateRef = ref(null)
const conflictWeekRef = ref(null)

let heatmapChart = null
let preferenceChart = null
let conflictDateChart = null
let conflictWeekChart = null

const stats = ref({
  totalCenters: 0,
  totalRooms: 0,
  totalBookings: 0,
  rejectedBookings: 0
})

const heatmapData = ref(null)
const preferenceData = ref(null)
const conflictData = ref(null)

const loadStats = async () => {
  try {
    const centers = await centerApi.getAll()
    const rooms = await centerApi.getAllRooms()
    const bookings = await bookingApi.getList({})
    
    stats.value = {
      totalCenters: centers.length,
      totalRooms: rooms.length,
      totalBookings: bookings.length,
      rejectedBookings: bookings.filter(b => b.status === 'REJECTED').length
    }
  } catch (e) {
    console.error(e)
  }
}

const loadHeatmapData = async () => {
  try {
    heatmapData.value = await analyticsApi.getOccupancyHeatmap(parseInt(selectedYear.value))
    await nextTick()
    renderHeatmap()
  } catch (e) {
    console.error(e)
  }
}

const loadPreferenceData = async () => {
  try {
    preferenceData.value = await analyticsApi.getPetTypePreference()
    await nextTick()
    renderPreference()
  } catch (e) {
    console.error(e)
  }
}

const loadConflictData = async () => {
  if (!conflictDate.value) return
  
  const [year, month] = conflictDate.value.split('-').map(Number)
  
  try {
    conflictData.value = await analyticsApi.getConflictAnalysis(year, month)
    await nextTick()
    renderConflictCharts()
  } catch (e) {
    console.error(e)
  }
}

const renderHeatmap = () => {
  if (!heatmapRef.value || !heatmapData.value) return
  
  if (heatmapChart) {
    heatmapChart.dispose()
  }
  
  heatmapChart = echarts.init(heatmapRef.value)
  
  const months = heatmapData.value.months || []
  const roomTypes = heatmapData.value.roomTypes || []
  const data = heatmapData.value.heatmapData || []
  
  const chartData = data.map(item => [
    months.indexOf(item.month),
    roomTypes.indexOf(item.roomTypeName),
    item.occupancyRate
  ])
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const item = data[params.dataIndex]
        return `${item.month} - ${item.roomTypeName}<br/>入住率: ${item.occupancyRate}%`
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '5%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: months,
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: roomTypes,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      }
    },
    series: [{
      name: '入住率',
      type: 'heatmap',
      data: chartData,
      label: {
        show: true,
        formatter: (params) => `${params.value[2]}%`
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  heatmapChart.setOption(option)
}

const renderPreference = () => {
  if (!preferenceRef.value || !preferenceData.value) return
  
  if (preferenceChart) {
    preferenceChart.dispose()
  }
  
  preferenceChart = echarts.init(preferenceRef.value)
  
  const data = preferenceData.value.data || []
  
  const roomTypeNames = data.map(item => item.roomTypeName)
  const dogData = data.map(item => item.dogPercentage)
  const catData = data.map(item => item.catPercentage)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(p => {
          result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['狗', '猫'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: roomTypeNames,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '狗',
        type: 'bar',
        stack: 'total',
        data: dogData,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '猫',
        type: 'bar',
        stack: 'total',
        data: catData,
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  }
  
  preferenceChart.setOption(option)
}

const renderConflictCharts = () => {
  if (!conflictDateRef.value || !conflictWeekRef.value || !conflictData.value) return
  
  if (conflictDateChart) {
    conflictDateChart.dispose()
  }
  if (conflictWeekChart) {
    conflictWeekChart.dispose()
  }
  
  conflictDateChart = echarts.init(conflictDateRef.value)
  conflictWeekChart = echarts.init(conflictWeekRef.value)
  
  const byDateData = conflictData.value.byDate || []
  const byDayData = conflictData.value.byDayOfWeek || []
  
  const dateOption = {
    tooltip: {
      trigger: 'axis'
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
      data: byDateData.map(item => item.date?.split('-')[2] || ''),
      axisLabel: {
        rotate: 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: byDateData.map(item => item.conflicts),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(245, 108, 108, 0.3)'
      },
      lineStyle: {
        color: '#f56c6c'
      },
      itemStyle: {
        color: '#f56c6c'
      }
    }]
  }
  
  const weekOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
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
      data: byDayData.map(item => item.day)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: byDayData.map(item => item.conflicts),
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      }
    }]
  }
  
  conflictDateChart.setOption(dateOption)
  conflictWeekChart.setOption(weekOption)
}

watch(activeTab, (newVal) => {
  setTimeout(() => {
    if (newVal === 'heatmap' && heatmapChart) {
      heatmapChart.resize()
    }
    if (newVal === 'preference' && preferenceChart) {
      preferenceChart.resize()
    }
    if (newVal === 'conflict') {
      if (conflictDateChart) conflictDateChart.resize()
      if (conflictWeekChart) conflictWeekChart.resize()
    }
  }, 100)
})

const handleResize = () => {
  if (heatmapChart) heatmapChart.resize()
  if (preferenceChart) preferenceChart.resize()
  if (conflictDateChart) conflictDateChart.resize()
  if (conflictWeekChart) conflictWeekChart.resize()
}

onMounted(() => {
  loadStats()
  loadHeatmapData()
  loadPreferenceData()
  loadConflictData()
  
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.stat-card {
  border: none;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 450px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

.analytics-tabs {
  .el-tabs__header {
    margin-bottom: 20px;
  }
}
</style>
