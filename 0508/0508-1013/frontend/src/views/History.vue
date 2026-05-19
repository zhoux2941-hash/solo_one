<template>
  <div class="history-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="床位号">
          <el-select v-model="filterForm.bedNo" placeholder="全部床位" clearable>
            <el-option
              v-for="i in 12"
              :key="i"
              :label="i + '号床'"
              :value="i"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadHistory" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="chart-card" v-if="chartVisible">
      <template #header>
        <span>体温变化趋势</span>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>体温记录列表</span>
        <span style="float: right; color: #909399;">共 {{ records.length }} 条记录</span>
      </template>
      <el-table :data="records" stripe style="width: 100%">
        <el-table-column prop="bedNo" label="床位号" width="100">
          <template #default="{ row }">
            {{ row.bedNo }}号床
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="体温(℃)" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-abnormal': row.abnormal }">
              {{ row.temperature.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="recordTime" label="记录时间" width="200">
          <template #default="{ row }">
            {{ formatTime(row.recordTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="abnormal" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.abnormal ? 'danger' : 'success'" size="small">
              {{ row.abnormal ? '异常' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abnormalType" label="异常类型" width="140">
          <template #default="{ row }">
            {{ getAbnormalTypeText(row.abnormalType) }}
          </template>
        </el-table-column>
        <el-table-column prop="abnormalMessage" label="异常说明" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { getBedHistory } from '../api'

const loading = ref(false)
const records = ref([])
const chartRef = ref(null)
let chartInstance = null

const filterForm = reactive({
  bedNo: null,
  dateRange: []
})

const chartVisible = ref(false)

const formatTime = (time) => {
  if (!time) return '--'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { hour12: false })
}

const getAbnormalTypeText = (type) => {
  const typeMap = {
    'LOW_TEMPERATURE': '体温过低',
    'HIGH_TEMPERATURE': '体温过高',
    'RAPID_RISE': '快速上升'
  }
  return typeMap[type] || '--'
}

const loadHistory = async () => {
  loading.value = true
  try {
    const bedNo = filterForm.bedNo
    if (!bedNo) {
      records.value = []
      return
    }
    
    const params = { limit: 100 }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    
    const res = await getBedHistory(bedNo, params)
    records.value = res.data || []
    chartVisible.value = records.value.length > 0
    
    if (chartVisible.value) {
      await nextTick()
      initChart()
    }
  } catch (e) {
    console.error('加载历史记录失败', e)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.bedNo = null
  filterForm.dateRange = []
  records.value = []
  chartVisible.value = false
}

const initChart = () => {
  if (!chartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const sortedRecords = [...records.value].sort((a, b) => 
    new Date(a.recordTime) - new Date(b.recordTime)
  )
  
  const times = sortedRecords.map(r => formatTime(r.recordTime).split(' ')[1])
  const temps = sortedRecords.map(r => r.temperature)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>体温: ${data.value}℃`
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
      boundaryGap: false,
      data: times
    },
    yAxis: {
      type: 'value',
      min: 35,
      max: 39,
      axisLabel: {
        formatter: '{value}℃'
      }
    },
    series: [{
      name: '体温',
      type: 'line',
      smooth: true,
      data: temps,
      markLine: {
        silent: true,
        data: [
          { yAxis: 36.0, lineStyle: { color: '#67c23a', type: 'dashed' } },
          { yAxis: 37.2, lineStyle: { color: '#f56c6c', type: 'dashed' } }
        ],
        label: {
          formatter: '{b}'
        }
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
        ])
      },
      lineStyle: {
        color: '#667eea',
        width: 2
      },
      itemStyle: {
        color: (params) => {
          const temp = params.value
          if (temp < 36.0 || temp > 37.2) {
            return '#f56c6c'
          }
          return '#667eea'
        }
      }
    }]
  }
  
  chartInstance.setOption(option)
}

watch(filterForm.bedNo, (newVal) => {
  if (newVal) {
    loadHistory()
  }
})

onMounted(() => {
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card,
.chart-card,
.table-card {
  border: none;
  border-radius: 12px;
}

.filter-form {
  margin: 0;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.text-abnormal {
  color: #f56c6c;
  font-weight: 600;
}
</style>
