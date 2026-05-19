<template>
  <div class="monitor-page">
    <el-card class="control-card">
      <div class="control-bar">
        <div class="status-info">
          <el-tag :type="simulationRunning ? 'success' : 'info'" size="large">
            {{ simulationRunning ? '数据采集中' : '数据采集已停止' }}
          </el-tag>
          <span class="update-time">最后更新：{{ lastUpdateTime }}</span>
        </div>
        <div class="control-buttons">
          <el-button type="primary" @click="handleInitData" :disabled="loading">
            <el-icon><RefreshRight /></el-icon>
            初始化数据
          </el-button>
          <el-button :type="simulationRunning ? 'danger' : 'success'" @click="toggleSimulation" :disabled="loading">
            <el-icon>{{ simulationRunning ? 'VideoPause' : 'VideoPlay' }}</el-icon>
            {{ simulationRunning ? '停止采集' : '开始采集' }}
          </el-button>
        </div>
      </div>
      <div class="stats-bar">
        <el-statistic title="总床位" :value="12" />
        <el-statistic title="正常" :value="normalCount" class="stat-normal" />
        <el-statistic title="异常" :value="abnormalCount" class="stat-abnormal" />
        <el-statistic title="在线连接" :value="connectionCount" />
      </div>
    </el-card>

    <el-card class="bed-card">
      <template #header>
        <div class="card-header">
          <span>床位布局图</span>
          <div class="legend">
            <span class="legend-item">
              <span class="legend-color normal"></span>
              正常
            </span>
            <span class="legend-item">
              <span class="legend-color abnormal"></span>
              异常
            </span>
            <span class="legend-item">
              <span class="legend-color no-data"></span>
              无数据
            </span>
          </div>
        </div>
      </template>
      <div class="bed-grid">
        <div
          v-for="bed in beds"
          :key="bed.bedNo"
          class="bed-item"
          :class="{
            'bed-abnormal': bed.abnormal,
            'bed-normal': !bed.abnormal && bed.currentTemperature,
            'bed-no-data': !bed.currentTemperature
          }"
          @click="showBedDetail(bed)"
        >
          <div class="bed-number">{{ bed.bedNo }}号床</div>
          <div class="bed-name">{{ bed.childName || '未分配' }}</div>
          <div class="bed-temp" v-if="bed.currentTemperature">
            {{ bed.currentTemperature.toFixed(1) }}℃
          </div>
          <div class="bed-temp no-temp" v-else>--℃</div>
          <el-icon v-if="bed.abnormal" class="warning-icon"><WarningFilled /></el-icon>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="床位详情" width="700px" @open="handleDialogOpen" @close="handleDialogClose">
      <div class="bed-detail" v-if="selectedBed">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="床位号">{{ selectedBed.bedNo }}号床</el-descriptions-item>
          <el-descriptions-item label="幼儿姓名">{{ selectedBed.childName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="当前体温">
            <span :class="{ 'text-abnormal': selectedBed.abnormal }">
              {{ selectedBed.currentTemperature ? selectedBed.currentTemperature.toFixed(1) + '℃' : '--' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="上次体温">
            {{ selectedBed.lastTemperature ? selectedBed.lastTemperature.toFixed(1) + '℃' : '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedBed.abnormal ? 'danger' : 'success'">
              {{ selectedBed.abnormal ? '异常' : '正常' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatTime(selectedBed.recordTime) }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="abnormal-info" v-if="selectedBed.abnormal">
          <el-alert
            :title="selectedBed.abnormalMessage || '体温异常'"
            type="error"
            :closable="false"
            show-icon
          />
        </div>

        <div class="chart-section">
          <div class="chart-header">
            <span class="chart-title">近24小时体温趋势</span>
            <el-button size="small" type="primary" @click="loadHistoryData" :loading="chartLoading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          <div ref="chartRef" class="chart-container" v-loading="chartLoading"></div>
          <el-empty v-if="historyRecords.length === 0 && !chartLoading" description="暂无历史数据" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  getTemperatureSnapshot,
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  generateInitialData,
  getBedHistory
} from '../api'

const loading = ref(false)
const simulationRunning = ref(false)
const lastUpdateTime = ref('--')
const detailVisible = ref(false)
const selectedBed = ref(null)
const connectionCount = ref(0)
const chartLoading = ref(false)
const historyRecords = ref([])
const chartRef = ref(null)
let chartInstance = null
let eventSource = null

const bedData = reactive({})
for (let i = 1; i <= 12; i++) {
  bedData[i] = { bedNo: i, childName: null, currentTemperature: null, abnormal: false }
}

const beds = computed(() => {
  return Object.values(bedData).sort((a, b) => a.bedNo - b.bedNo)
})

const abnormalCount = computed(() => {
  return beds.value.filter(b => b.abnormal).length
})

const normalCount = computed(() => {
  return beds.value.filter(b => !b.abnormal && b.currentTemperature).length
})

const formatTime = (time) => {
  if (!time) return '--'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { hour12: false })
}

const loadSnapshot = async () => {
  try {
    const res = await getTemperatureSnapshot()
    if (res.data && res.data.snapshots) {
      res.data.snapshots.forEach(snapshot => {
        bedData[snapshot.bedNo] = { ...bedData[snapshot.bedNo], ...snapshot }
      })
    }
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e) {
    console.error('加载快照失败', e)
  }
}

const loadSimulationStatus = async () => {
  try {
    const res = await getSimulationStatus()
    simulationRunning.value = res.data.running
  } catch (e) {
    console.error('获取状态失败', e)
  }
}

const toggleSimulation = async () => {
  loading.value = true
  try {
    if (simulationRunning.value) {
      await stopSimulation()
      ElMessage.success('数据采集已停止')
    } else {
      await startSimulation()
      ElMessage.success('数据采集已启动')
    }
    await loadSimulationStatus()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

const handleInitData = async () => {
  loading.value = true
  try {
    await generateInitialData()
    ElMessage.success('初始数据生成完成')
    await loadSnapshot()
  } catch (e) {
    ElMessage.error('初始化失败')
  } finally {
    loading.value = false
  }
}

const showBedDetail = (bed) => {
  selectedBed.value = bed
  detailVisible.value = true
}

const handleDialogOpen = async () => {
  if (selectedBed.value) {
    await loadHistoryData()
  }
}

const handleDialogClose = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  historyRecords.value = []
}

const loadHistoryData = async () => {
  if (!selectedBed.value) return
  
  chartLoading.value = true
  try {
    const bedNo = selectedBed.value.bedNo
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000)
    
    const res = await getBedHistory(bedNo, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    })
    
    historyRecords.value = (res.data || []).reverse()
    await nextTick()
    initChart()
  } catch (e) {
    console.error('加载历史数据失败', e)
    ElMessage.error('加载历史数据失败')
  } finally {
    chartLoading.value = false
  }
}

const initChart = () => {
  if (!chartRef.value || historyRecords.value.length === 0) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const times = historyRecords.value.map(r => {
    const d = new Date(r.recordTime)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  })
  const temps = historyRecords.value.map(r => r.temperature)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        const record = historyRecords.value[data.dataIndex]
        let status = '正常'
        if (record.abnormal) {
          if (record.abnormalType === 'HIGH_TEMPERATURE') status = '体温过高'
          else if (record.abnormalType === 'LOW_TEMPERATURE') status = '体温过低'
          else if (record.abnormalType === 'RAPID_RISE') status = '快速上升'
        }
        return `${data.name}<br/>体温: ${data.value}℃<br/>状态: ${status}`
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
      data: times,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
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
          { 
            yAxis: 36.0, 
            lineStyle: { color: '#67c23a', type: 'dashed', width: 2 },
            label: { formatter: '正常下限 36.0℃', fontSize: 10 }
          },
          { 
            yAxis: 37.2, 
            lineStyle: { color: '#f56c6c', type: 'dashed', width: 2 },
            label: { formatter: '正常上限 37.2℃', fontSize: 10 }
          }
        ]
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
          const record = historyRecords.value[params.dataIndex]
          if (record && record.abnormal) {
            return '#f56c6c'
          }
          return '#667eea'
        },
        borderWidth: 2,
        borderColor: '#fff'
      },
      symbolSize: 8
    }]
  }
  
  chartInstance.setOption(option)
  
  window.addEventListener('resize', handleChartResize)
}

const handleChartResize = () => {
  chartInstance?.resize()
}

const initSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  
  try {
    eventSource = new EventSource('/api/sse/subscribe')

    eventSource.addEventListener('temperature-update', (event) => {
      try {
        const data = JSON.parse(event.data)
        bedData[data.bedNo] = { ...bedData[data.bedNo], ...data }
        lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
        
        if (data.abnormal) {
          ElMessage.warning({
            message: `${data.childName || data.bedNo + '号床'} 体温异常！`,
            duration: 3000,
            offset: 60
          })
        }
      } catch (e) {
        console.error('解析SSE数据失败', e)
      }
    })

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.bedNo) {
          bedData[data.bedNo] = { ...bedData[data.bedNo], ...data }
          lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
          
          if (data.abnormal) {
            ElMessage.warning({
              message: `${data.childName || data.bedNo + '号床'} 体温异常！`,
              duration: 3000,
              offset: 60
            })
          }
        }
      } catch (e) {
        console.error('解析SSE消息失败', e)
      }
    })

    eventSource.addEventListener('heartbeat', () => {
      connectionCount.value++
    })

    eventSource.onopen = () => {
      console.log('SSE连接已建立')
    }

    eventSource.onerror = (err) => {
      console.error('SSE连接错误:', err)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      console.log('SSE连接断开，5秒后重连...')
      setTimeout(initSSE, 5000)
    }
  } catch (e) {
    console.error('创建SSE连接失败:', e)
    setTimeout(initSSE, 5000)
  }
}

onMounted(() => {
  loadSnapshot()
  loadSimulationStatus()
  initSSE()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleChartResize)
})
</script>

<style scoped>
.monitor-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-card {
  border: none;
  border-radius: 12px;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-time {
  color: #909399;
  font-size: 14px;
}

.control-buttons {
  display: flex;
  gap: 12px;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stat-normal :deep(.el-statistic__number) {
  color: #67c23a;
}

.stat-abnormal :deep(.el-statistic__number) {
  color: #f56c6c;
}

.bed-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.normal {
  background: #67c23a;
}

.legend-color.abnormal {
  background: #f56c6c;
}

.legend-color.no-data {
  background: #dcdfe6;
}

.bed-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 10px;
}

.bed-item {
  position: relative;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  background: #f5f7fa;
}

.bed-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.bed-normal {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-color: #67c23a;
}

.bed-abnormal {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #f56c6c;
  animation: pulse 1.5s ease-in-out infinite;
}

.bed-no-data {
  background: #f5f7fa;
  border-color: #dcdfe6;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
}

.bed-number {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.bed-name {
  font-size: 16px;
  color: #606266;
  margin-bottom: 12px;
}

.bed-temp {
  font-size: 32px;
  font-weight: 700;
  color: #67c23a;
}

.bed-abnormal .bed-temp {
  color: #f56c6c;
}

.bed-temp.no-temp {
  color: #c0c4cc;
}

.warning-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  color: #f56c6c;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.bed-detail {
  padding: 10px 0;
}

.abnormal-info {
  margin-top: 20px;
}

.text-abnormal {
  color: #f56c6c;
  font-weight: 600;
}

.chart-section {
  margin-top: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
  background: #fafafa;
  border-radius: 8px;
}

@media (max-width: 1200px) {
  .bed-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .bed-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
