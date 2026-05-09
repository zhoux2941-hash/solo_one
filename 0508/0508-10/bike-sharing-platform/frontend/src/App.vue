<template>
  <div class="app-container">
    <header class="header">
      <h1>共享单车运营平台</h1>
      <div class="header-info">
        <span class="update-time">最后更新: {{ lastUpdateTime }}</span>
        <button @click="refreshAllData" class="btn btn-primary">刷新数据</button>
        <button 
          @click="optimizeRoutes" 
          class="btn btn-success"
          :disabled="isOptimizing"
        >
          <span v-if="isOptimizing">优化中...</span>
          <span v-else>🚀 一键优化调度</span>
        </button>
      </div>
    </header>

    <div class="main-content">
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>状态统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">总停车点</span>
              <span class="stat-value">{{ parkingPoints.length }}</span>
            </div>
            <div class="stat-item">
              <span class="status-dot status-over-saturated"></span>
              <span class="stat-label">过饱和</span>
              <span class="stat-value">{{ overSaturatedCount }}</span>
            </div>
            <div class="stat-item">
              <span class="status-dot status-shortage"></span>
              <span class="stat-label">紧缺</span>
              <span class="stat-value">{{ shortageCount }}</span>
            </div>
            <div class="stat-item">
              <span class="status-dot status-normal"></span>
              <span class="stat-label">正常</span>
              <span class="stat-value">{{ normalCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="routePlan && routePlan.steps.length > 0" class="sidebar-section route-section">
          <h3>📋 最优调度方案</h3>
          <div class="route-summary">
            <div class="summary-item">
              <span class="summary-label">总距离</span>
              <span class="summary-value">{{ routePlan.totalDistanceKm }} km</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">预计时间</span>
              <span class="summary-value">{{ routePlan.totalDurationMinutes }} 分钟</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">调度车辆</span>
              <span class="summary-value">{{ routePlan.vehiclesUsed }} 辆</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">移动车辆</span>
              <span class="summary-value">{{ routePlan.totalBikesMoved }} 辆</span>
            </div>
          </div>

          <div class="steps-list">
            <div
              v-for="(step, index) in routePlan.steps"
              :key="index"
              class="step-item"
              :class="{ 'step-active': currentStep === index }"
              @click="focusStep(index)"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-route">
                  <span class="tag tag-red">{{ step.fromPointName }}</span>
                  <span class="step-arrow">→</span>
                  <span class="tag tag-green">{{ step.toPointName }}</span>
                </div>
                <div class="step-details">
                  <span v-if="step.bikeCount > 0" class="bike-transfer">
                    调 {{ step.bikeCount }} 辆车
                  </span>
                  <span class="step-distance">{{ step.distanceKm.toFixed(2) }} km</span>
                  <span class="step-duration">{{ step.durationMinutes }} 分钟</span>
                </div>
                <p class="step-action">{{ step.action }}</p>
              </div>
            </div>
          </div>

          <button @click="clearRoutePlan" class="btn btn-outline">
            清除方案
          </button>
        </div>

        <div v-else class="sidebar-section">
          <h3>调度建议</h3>
          <div class="suggestions-list">
            <div
              v-for="(suggestion, index) in dispatchSuggestions"
              :key="index"
              class="suggestion-item"
            >
              <div class="suggestion-header">
                <span class="tag tag-red">{{ suggestion.fromPointName }}</span>
                <span class="arrow">→</span>
                <span class="tag tag-green">{{ suggestion.toPointName }}</span>
              </div>
              <div class="suggestion-body">
                <span class="bike-count">调 {{ suggestion.bikeCount }} 辆车</span>
                <span class="distance">约 {{ suggestion.estimatedDistance.toFixed(2) }} km</span>
              </div>
              <p class="suggestion-reason">{{ suggestion.reason }}</p>
            </div>
            <div v-if="dispatchSuggestions.length === 0" class="no-suggestions">
              暂无调度建议
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>供需热力图例</h3>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color" style="background: #52c41a"></div>
              <span>富余 (>80%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #faad14"></div>
              <span>正常 (20%-80%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #f5222d"></div>
              <span>紧缺 (<20%)</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="map-section">
        <BikeMap
          :parkingPoints="parkingPoints"
          :predictions="predictions"
          :routePlan="routePlan"
          :currentStep="currentStep"
        />
      </div>

      <aside class="right-panel">
        <div class="panel-section">
          <h3>过去一周借还需求（按小时）</h3>
          <DemandChart :data="hourlyDemand" />
        </div>

        <div class="panel-section">
          <h3>未来2小时预测（前10个停车点）</h3>
          <div class="predictions-list">
            <div
              v-for="(pred, index) in topPredictions"
              :key="index"
              class="prediction-item"
            >
              <div class="prediction-point">
                <strong>{{ pred.pointName }}</strong>
                <span class="confidence">置信度: {{ (pred.confidence * 100).toFixed(0) }}%</span>
              </div>
              <div class="prediction-values">
                <span class="tag tag-red">借车 +{{ pred.predictedBorrowDemand }}</span>
                <span class="tag tag-green">还车 +{{ pred.predictedReturnDemand }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import BikeMap from './components/BikeMap.vue'
import DemandChart from './components/DemandChart.vue'

const parkingPoints = ref([])
const hourlyDemand = ref([])
const predictions = ref([])
const dispatchSuggestions = ref([])
const routePlan = ref(null)
const currentStep = ref(-1)
const isOptimizing = ref(false)
const lastUpdateTime = ref('-')

const overSaturatedCount = computed(() => 
  parkingPoints.value.filter(p => p.status === 'OVER_SATURATED').length
)
const shortageCount = computed(() => 
  parkingPoints.value.filter(p => p.status === 'SHORTAGE').length
)
const normalCount = computed(() => 
  parkingPoints.value.filter(p => p.status === 'NORMAL').length
)

const topPredictions = computed(() => {
  const grouped = {}
  predictions.value.forEach(p => {
    if (!grouped[p.pointId]) {
      grouped[p.pointId] = {
        pointId: p.pointId,
        pointName: p.pointName,
        predictedBorrowDemand: 0,
        predictedReturnDemand: 0,
        confidence: 0
      }
    }
    grouped[p.pointId].predictedBorrowDemand += p.predictedBorrowDemand
    grouped[p.pointId].predictedReturnDemand += p.predictedReturnDemand
    grouped[p.pointId].confidence = Math.max(grouped[p.pointId].confidence, p.confidence)
  })
  
  return Object.values(grouped)
    .sort((a, b) => b.predictedBorrowDemand - a.predictedBorrowDemand)
    .slice(0, 10)
})

let refreshInterval = null

const fetchParkingPoints = async () => {
  try {
    const res = await axios.get('/api/parking-points/status')
    parkingPoints.value = res.data
    updateTime()
  } catch (err) {
    console.error('获取停车点失败:', err)
  }
}

const fetchHourlyDemand = async () => {
  try {
    const res = await axios.get('/api/analysis/hourly-demand')
    hourlyDemand.value = res.data
  } catch (err) {
    console.error('获取需求数据失败:', err)
  }
}

const fetchPredictions = async () => {
  try {
    const res = await axios.get('/api/prediction/next-2h')
    predictions.value = res.data
  } catch (err) {
    console.error('获取预测数据失败:', err)
  }
}

const fetchDispatchSuggestions = async () => {
  try {
    const res = await axios.get('/api/dispatch/suggestions')
    dispatchSuggestions.value = res.data
  } catch (err) {
    console.error('获取调度建议失败:', err)
  }
}

const optimizeRoutes = async () => {
  isOptimizing.value = true
  try {
    const res = await axios.post('/api/routing/optimize')
    routePlan.value = res.data
    currentStep.value = 0
    
    if (routePlan.value.status === 'NO_DISPATCH_NEEDED') {
      alert('当前供需平衡，无需调度！')
      routePlan.value = null
    }
  } catch (err) {
    console.error('路线优化失败:', err)
    alert('路线优化失败，请稍后重试')
  } finally {
    isOptimizing.value = false
  }
}

const focusStep = (index) => {
  currentStep.value = index
}

const clearRoutePlan = () => {
  routePlan.value = null
  currentStep.value = -1
}

const refreshAllData = () => {
  fetchParkingPoints()
  fetchHourlyDemand()
  fetchPredictions()
  fetchDispatchSuggestions()
}

const updateTime = () => {
  const now = new Date()
  lastUpdateTime.value = now.toLocaleString('zh-CN')
}

onMounted(() => {
  refreshAllData()
  refreshInterval = setInterval(fetchParkingPoints, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 13px;
  opacity: 0.9;
}

.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #73d13d;
}

.btn-success:disabled {
  background-color: #b7eb8f;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: #1890ff;
  border: 1px solid #1890ff;
  margin-top: 12px;
  width: 100%;
}

.btn-outline:hover {
  background-color: #e6f7ff;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 340px;
  background: white;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  padding: 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h3 {
  font-size: 14px;
  color: #262626;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.route-section {
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
}

.route-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: white;
  border-radius: 6px;
  text-align: center;
}

.summary-label {
  font-size: 11px;
  color: #8c8c8c;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  margin-top: 2px;
}

.steps-list {
  max-height: 350px;
  overflow-y: auto;
}

.step-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.step-item:hover {
  transform: translateX(2px);
}

.step-item.step-active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-route {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.step-arrow {
  color: #8c8c8c;
}

.step-details {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 12px;
}

.bike-transfer {
  color: #1890ff;
  font-weight: 500;
}

.step-distance, .step-duration {
  color: #8c8c8c;
}

.step-action {
  font-size: 11px;
  color: #595959;
  line-height: 1.4;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #595959;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
  margin-left: auto;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.arrow {
  color: #8c8c8c;
  font-weight: bold;
}

.suggestion-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bike-count {
  font-weight: 600;
  color: #1890ff;
}

.distance {
  font-size: 12px;
  color: #8c8c8c;
}

.suggestion-reason {
  font-size: 12px;
  color: #595959;
  line-height: 1.5;
}

.no-suggestions {
  text-align: center;
  color: #8c8c8c;
  padding: 20px;
  font-size: 13px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #595959;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.map-section {
  flex: 1;
  position: relative;
}

.right-panel {
  width: 380px;
  background: white;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
  padding: 16px;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section h3 {
  font-size: 14px;
  color: #262626;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prediction-item {
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
}

.prediction-point {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.confidence {
  font-size: 11px;
  color: #8c8c8c;
}

.prediction-values {
  display: flex;
  gap: 8px;
}
</style>
