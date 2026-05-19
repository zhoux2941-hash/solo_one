<template>
  <div class="dashboard">
    <h2>数据看板</h2>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="30" color="#fff"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.totalParkingLots || 0 }}</p>
              <p class="stat-label">车场总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="30" color="#fff"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.todayOrders || 0 }}</p>
              <p class="stat-label">今日订单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="30" color="#fff"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">¥{{ statistics.todayRevenue || 0 }}</p>
              <p class="stat-label">今日营收</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="30" color="#fff"><Van /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.currentParkingVehicles || 0 }}</p>
              <p class="stat-label">在场车辆</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>车场实时状态</span>
          </template>
          <div ref="parkingLotChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>车位热力图</span>
          </template>
          <div ref="heatmapChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <span>车流峰值统计</span>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              size="small"
              style="margin-left: 20px"
              @change="loadPeakData"
            />
          </template>
          <div ref="peakChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const statistics = ref({})
const parkingLotChart = ref(null)
const heatmapChart = ref(null)
const peakChart = ref(null)
const dateRange = ref([])

const loadStatistics = async () => {
  const res = await request.get('/parking/statistics/dashboard')
  if (res.code === 200) {
    statistics.value = res.data
    renderParkingLotChart(res.data.parkingLotStats)
  }
}

const loadHeatmapData = async () => {
  const res = await request.get('/parking/statistics/heatmap')
  if (res.code === 200) {
    renderHeatmapChart(res.data)
  }
}

const loadPeakData = async () => {
  if (!dateRange.value || dateRange.value.length < 2) return
  
  const res = await request.get('/parking/statistics/peak', {
    params: {
      start: dateRange.value[0].toISOString(),
      end: dateRange.value[1].toISOString()
    }
  })
  if (res.code === 200) {
    renderPeakChart(res.data.hourlyData)
  }
}

const renderParkingLotChart = (data) => {
  if (!parkingLotChart.value) return
  
  const chart = echarts.init(parkingLotChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['总车位', '可用车位', '在场车辆']
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '总车位',
        type: 'bar',
        data: data.map(item => item.totalSpaces),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '可用车位',
        type: 'bar',
        data: data.map(item => item.availableSpaces),
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '在场车辆',
        type: 'bar',
        data: data.map(item => item.parkingVehicles),
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  chart.setOption(option)
}

const renderHeatmapChart = (data) => {
  if (!heatmapChart.value) return
  
  const chart = echarts.init(heatmapChart.value)
  const option = {
    tooltip: {
      formatter: (params) => {
        return `${params.name}<br/>利用率: ${params.value.toFixed(1)}%`
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0',
      inRange: {
        color: ['#67C23A', '#E6A23C', '#F56C6C']
      }
    },
    series: [{
      type: 'scatter',
      symbolSize: (val) => val[2] * 2 + 20,
      data: data.map(item => [item.longitude, item.latitude, item.utilization, item.name]),
      encode: {
        tooltip: [2, 3]
      },
      label: {
        show: true,
        formatter: (params) => params.data[3],
        position: 'top'
      }
    }]
  }
  chart.setOption(option)
}

const renderPeakChart = (data) => {
  if (!peakChart.value || !data) return
  
  const chart = echarts.init(peakChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.hour),
      axisLabel: { rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: '车流量'
    },
    series: [{
      data: data.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      },
      itemStyle: { color: '#409EFF' }
    }]
  }
  chart.setOption(option)
}

onMounted(async () => {
  await loadStatistics()
  await loadHeatmapData()
  
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  dateRange.value = [yesterday, now]
  
  await nextTick()
  loadPeakData()
  
  window.addEventListener('space-update', () => {
    loadStatistics()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard h2 {
  margin-bottom: 20px;
  color: #333;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
}
</style>
