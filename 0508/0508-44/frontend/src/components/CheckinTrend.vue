<template>
  <div class="checkin-trend">
    <div class="header">
      <h2 class="title">📈 打卡趋势分析</h2>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="content" v-if="trend.length > 0">
      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>

      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalDays }}</div>
            <div class="stat-label">打卡天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value success">{{ successDays }}</div>
            <div class="stat-label">成功天数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <div class="stat-value points">{{ totalPoints }}</div>
            <div class="stat-label">获得积分</div>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无趋势数据</div>
      <div class="empty-desc">开始打卡后将显示您的打卡趋势</div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import teamService from '../api/teamService.js'

const props = defineProps({
  employeeNo: {
    type: String,
    required: true
  },
  refreshTrigger: {
    type: Number,
    default: 0
  }
})

const chartRef = ref(null)
const trend = ref([])
const loading = ref(false)
const errorMessage = ref(null)
let chartInstance = null

const totalDays = computed(() => {
  return trend.value.filter(item => item.isSuccess !== null).length
})

const successDays = computed(() => {
  return trend.value.filter(item => item.isSuccess === true).length
})

const totalPoints = computed(() => {
  return trend.value.reduce((sum, item) => sum + (item.pointsEarned || 0), 0)
})

const successRate = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.round((successDays.value / totalDays.value) * 100)
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} ${weekday}`
}

const initChart = () => {
  if (!chartRef.value || trend.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const dates = trend.value.map(item => formatDate(item.date))
  const successData = trend.value.map(item => {
    if (item.isSuccess === true) return item.pointsEarned || 0
    return null
  })
  const failData = trend.value.map(item => {
    if (item.isSuccess === false) return 0
    return null
  })
  const noData = trend.value.map(item => {
    if (item.isSuccess === null) return null
    return null
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        if (data.value === null) {
          return `${data.axisValue}<br/>未打卡`
        }
        const item = trend.value[data.dataIndex]
        return `${data.axisValue}<br/>${item.isSuccess ? '✅ 打卡成功' : '❌ 打卡失败'}<br/>积分: +${item.pointsEarned || 0}分`
      }
    },
    legend: {
      data: ['成功', '失败'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        fontSize: 11,
        rotate: 15
      }
    },
    yAxis: {
      type: 'value',
      name: '积分',
      min: 0
    },
    series: [
      {
        name: '成功',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: successData,
        itemStyle: {
          color: '#52c41a'
        },
        lineStyle: {
          color: '#52c41a',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
          ])
        }
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        data: failData,
        itemStyle: {
          color: '#ff4d4f'
        },
        lineStyle: {
          color: '#ff4d4f',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
            { offset: 1, color: 'rgba(255, 77, 79, 0.05)' }
          ])
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const loadData = async () => {
  if (!props.employeeNo) return

  loading.value = true
  errorMessage.value = null

  try {
    const result = await teamService.getCheckinTrend(props.employeeNo)
    if (result.code === 200) {
      trend.value = result.data || []
      setTimeout(initChart, 100)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '获取打卡趋势失败'
    console.error('获取打卡趋势失败:', error)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

watch(() => props.refreshTrigger, () => {
  loadData()
})

watch(() => props.employeeNo, () => {
  loadData()
})

defineExpose({
  refresh: loadData
})
</script>

<style scoped>
.checkin-trend {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  color: #333;
  font-size: 20px;
  margin: 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1976D2;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-container {
  width: 100%;
}

.chart {
  width: 100%;
  height: 300px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stat-value.success {
  color: #81C784;
}

.stat-value.points {
  color: #FFD54F;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #999;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  text-align: center;
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart {
    height: 250px;
  }
}
</style>
