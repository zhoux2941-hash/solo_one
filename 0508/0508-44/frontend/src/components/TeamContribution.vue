<template>
  <div class="team-contribution">
    <div class="header">
      <h2 class="title">📊 团队贡献分析</h2>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="content" v-if="contribution.length > 0">
      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
        <div class="chart-legend">
          <div class="legend-item" v-for="(item, index) in contribution" :key="item.employeeNo">
            <span class="legend-color" :style="{ backgroundColor: colors[index % colors.length] }"></span>
            <span class="legend-name">{{ item.employeeName }}</span>
            <span class="legend-points">{{ item.contributionPoints }}分 ({{ item.contributionRatio }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">📈</div>
      <div class="empty-text">暂无团队数据</div>
      <div class="empty-desc">您还没有加入任何团队</div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
const contribution = ref([])
const loading = ref(false)
const errorMessage = ref(null)
let chartInstance = null

const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']

const initChart = () => {
  if (!chartRef.value || contribution.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}分 ({d}%)'
    },
    legend: {
      show: false
    },
    series: [
      {
        name: '团队贡献',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 12
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: contribution.value.map((item, index) => ({
          value: item.contributionPoints,
          name: item.employeeName,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
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
    const result = await teamService.getTeamContribution(props.employeeNo)
    if (result.code === 200) {
      contribution.value = result.data || []
      setTimeout(initChart, 100)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '获取团队贡献失败'
    console.error('获取团队贡献失败:', error)
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
.team-contribution {
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
  display: flex;
  align-items: center;
  gap: 30px;
}

.chart {
  width: 300px;
  height: 300px;
  flex-shrink: 0;
}

.chart-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-name {
  font-weight: 600;
  color: #333;
  min-width: 80px;
}

.legend-points {
  margin-left: auto;
  color: #666;
  font-size: 14px;
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
  .chart-container {
    flex-direction: column;
  }

  .chart {
    width: 100%;
    height: 280px;
  }
}
</style>
