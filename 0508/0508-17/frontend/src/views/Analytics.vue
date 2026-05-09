<template>
  <div class="analytics-page">
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card class="filter-card">
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">数据范围：</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :disabled-date="disabledDate"
                style="width: 360px"
                @change="loadUsageData"
              />
            </div>
            <el-button type="primary" @click="loadAllData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>各区域使用率趋势</span>
              <el-tag v-if="selectedArea" type="info" size="small">{{ selectedArea }}</el-tag>
            </div>
          </template>
          <div class="area-tabs">
            <el-radio-group v-model="selectedArea" size="small">
              <el-radio-button v-for="area in areas" :key="area" :value="area">
                {{ area }}
              </el-radio-button>
              <el-radio-button value="ALL">全部</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="usageChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="top-seats-card">
          <template #header>
            <div class="card-header">
              <el-icon><Trophy /></el-icon>
              <span>最受欢迎工位 Top 5</span>
            </div>
          </template>
          <div class="top-seats-list">
            <div 
              v-for="(seat, index) in topSeats" 
              :key="seat.seatId" 
              class="top-seat-item"
            >
              <div class="rank" :class="'rank-' + (index + 1)">
                {{ index + 1 }}
              </div>
              <div class="seat-info">
                <div class="seat-number">工位 #{{ seat.seatId }}</div>
                <div class="booking-count">
                  <el-progress 
                    :percentage="getBookingPercentage(seat.bookingCount)" 
                    :show-text="false"
                    :stroke-width="8"
                  />
                </div>
              </div>
              <div class="count-badge">
                <el-tag :type="index < 3 ? 'warning' : 'info'" size="large">
                  {{ seat.bookingCount }} 次
                </el-tag>
              </div>
            </div>
            <el-empty v-if="topSeats.length === 0" description="暂无预订数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card class="prediction-card">
          <template #header>
            <div class="card-header">
              <el-icon><MagicStick /></el-icon>
              <span>未来一周空置时段预测</span>
              <el-tag type="success" v-if="bestPrediction" size="small">
                推荐：{{ formatPredictionDate(bestPrediction.date) }} {{ bestPrediction.bestSlot === 'MORNING' ? '上午' : '下午' }}
                (空置率 {{ bestPrediction.bestRate }}%)
              </el-tag>
            </div>
          </template>
          <div ref="predictionChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { analyticsApi, seatApi } from '@/api'

const dateRange = ref([
  dayjs().subtract(7, 'day').toDate(),
  dayjs().toDate()
])
const areas = ref([])
const selectedArea = ref('ALL')
const usageData = ref({})
const topSeats = ref([])
const predictions = ref([])
const maxBookingCount = ref(1)

const usageChartRef = ref(null)
const predictionChartRef = ref(null)
let usageChart = null
let predictionChart = null

const bestPrediction = computed(() => {
  if (predictions.value.length === 0) return null
  return predictions.value.reduce((best, current) => 
    current.bestRate > best.bestRate ? current : best
  )
})

const disabledDate = (time) => {
  return time.getTime() > dayjs().endOf('day').valueOf()
}

const formatPredictionDate = (dateStr) => {
  return dayjs(dateStr).format('MM月DD日')
}

const getBookingPercentage = (count) => {
  return Math.min(Math.round((count / maxBookingCount.value) * 100), 100)
}

const loadAreas = async () => {
  try {
    const response = await seatApi.getAreas()
    areas.value = response.data
    if (areas.value.length > 0 && selectedArea.value === 'ALL') {
      selectedArea.value = areas.value[0]
    }
  } catch (error) {
    console.error('加载区域失败', error)
  }
}

const loadUsageData = async () => {
  try {
    const startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    const endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    const response = await analyticsApi.getUsageRate(startDate, endDate)
    usageData.value = response.data
    await nextTick()
    renderUsageChart()
  } catch (error) {
    console.error('加载使用率数据失败', error)
  }
}

const loadTopSeats = async () => {
  try {
    const response = await analyticsApi.getTopSeats(5)
    topSeats.value = response.data
    if (topSeats.value.length > 0) {
      maxBookingCount.value = topSeats.value[0].bookingCount || 1
    }
  } catch (error) {
    console.error('加载热门工位失败', error)
  }
}

const loadPredictions = async () => {
  try {
    const response = await analyticsApi.predictAvailable()
    predictions.value = response.data.predictions || []
    await nextTick()
    renderPredictionChart()
  } catch (error) {
    console.error('加载预测数据失败', error)
  }
}

const loadAllData = async () => {
  await Promise.all([
    loadUsageData(),
    loadTopSeats(),
    loadPredictions()
  ])
}

const renderUsageChart = () => {
  if (!usageChartRef.value) return
  
  if (!usageChart) {
    usageChart = echarts.init(usageChartRef.value)
  }
  
  const data = selectedArea.value === 'ALL' 
    ? Object.values(usageData.value)[0] || []
    : usageData.value[selectedArea.value] || []
  
  const dates = data.map(d => d.date.slice(5))
  const morningRates = data.map(d => d.morningRate)
  const afternoonRates = data.map(d => d.afternoonRate)
  const avgRates = data.map(d => d.avgRate)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = params[0].axisValue + '<br/>'
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['上午使用率', '下午使用率', '平均使用率'],
      bottom: 0
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
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '使用率(%)',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '上午使用率',
        type: 'line',
        smooth: true,
        data: morningRates,
        lineStyle: { color: '#67c23a' },
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      },
      {
        name: '下午使用率',
        type: 'line',
        smooth: true,
        data: afternoonRates,
        lineStyle: { color: '#409eff' },
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '平均使用率',
        type: 'line',
        smooth: true,
        data: avgRates,
        lineStyle: { color: '#e6a23c', type: 'dashed' },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }
  
  usageChart.setOption(option)
}

const renderPredictionChart = () => {
  if (!predictionChartRef.value) return
  
  if (!predictionChart) {
    predictionChart = echarts.init(predictionChartRef.value)
  }
  
  const dayNameMap = {
    'MONDAY': '周一',
    'TUESDAY': '周二',
    'WEDNESDAY': '周三',
    'THURSDAY': '周四',
    'FRIDAY': '周五',
    'SATURDAY': '周六',
    'SUNDAY': '周日'
  }
  
  const dates = predictions.value.map(p => 
    `${formatPredictionDate(p.date)} ${dayNameMap[p.dayOfWeek] || p.dayOfWeek}`
  )
  const morningRates = predictions.value.map(p => p.morningAvailableRate)
  const afternoonRates = predictions.value.map(p => p.afternoonAvailableRate)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = params[0].axisValue + '<br/>'
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['上午空置率', '下午空置率'],
      bottom: 0
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
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '空置率(%)',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '上午空置率',
        type: 'bar',
        data: morningRates,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      },
      {
        name: '下午空置率',
        type: 'bar',
        data: afternoonRates,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67e8f9' },
            { offset: 0.5, color: '#22d3ee' },
            { offset: 1, color: '#06b6d4' }
          ])
        }
      }
    ]
  }
  
  predictionChart.setOption(option)
}

watch(selectedArea, () => {
  renderUsageChart()
})

onMounted(async () => {
  await loadAreas()
  await loadAllData()
  
  window.addEventListener('resize', () => {
    usageChart?.resize()
    predictionChart?.resize()
  })
})
</script>

<style scoped>
.analytics-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 500;
  color: #606266;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.chart-card,
.top-seats-card,
.prediction-card {
  height: 100%;
}

.area-tabs {
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.top-seats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-seat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.top-seat-item:hover {
  background: #f0f9eb;
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.rank.rank-1 {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.rank.rank-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.rank.rank-3 {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.rank.rank-4,
.rank.rank-5 {
  background: linear-gradient(135deg, #64748b, #475569);
}

.seat-info {
  flex: 1;
}

.seat-number {
  font-weight: 600;
  margin-bottom: 4px;
}

.booking-count {
  width: 100%;
}

.count-badge {
  margin-left: auto;
}
</style>
