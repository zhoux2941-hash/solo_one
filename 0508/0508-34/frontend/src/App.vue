<template>
  <div class="app-container">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">👁️</span>
        <h1>盲道障碍物磨损度监控系统</h1>
      </div>
      <div class="header-info">
        <span class="status-dot" :class="{ active: isLoading }"></span>
        <span class="status-text">{{ isLoading ? '加载中...' : '实时监控' }}</span>
      </div>
    </header>

    <main class="main-content">
      <div class="control-panel">
        <div class="date-control">
          <label for="date-picker">选择日期:</label>
          <input
            type="date"
            id="date-picker"
            v-model="selectedDate"
            @change="handleDateChange"
            :max="maxDate"
          />
        </div>
        <div class="date-shortcuts">
          <button @click="setToday" :class="{ active: isToday }">今天</button>
          <button @click="setYesterday">昨天</button>
          <button @click="setPrevDay" :disabled="isFirstDay">◀ 前一天</button>
          <button @click="setNextDay" :disabled="isLastDay">后一天 ▶</button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <WearScatterChart v-if="!error" :detection-points="detectionPoints" :prediction-data="predictionData" />

      <div class="stats-panel" v-if="detectionPoints.length">
        <div class="stat-card">
          <div class="stat-icon">📍</div>
          <div class="stat-content">
            <div class="stat-value">{{ detectionPoints.length }}</div>
            <div class="stat-label">检测点数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value" style="color: #f5222d;">{{ highWearCount }}</div>
            <div class="stat-label">高磨损点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-value" style="color: #faad14;">{{ mediumWearCount }}</div>
            <div class="stat-label">中磨损点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value" style="color: #52c41a;">{{ lowWearCount }}</div>
            <div class="stat-label">低磨损点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ averageWear }}%</div>
            <div class="stat-label">平均磨损度</div>
          </div>
        </div>
      </div>

      <div class="data-table" v-if="detectionPoints.length">
        <div class="table-header">
          <h3>检测点详细数据</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>检测点</th>
              <th>距离 (米)</th>
              <th>磨损度</th>
              <th>状态</th>
              <th>建议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(point, index) in detectionPoints" :key="index">
              <td>#{{ index + 1 }}</td>
              <td>{{ point.distance }} m</td>
              <td>
                <div class="wear-bar-container">
                  <div 
                    class="wear-bar" 
                    :style="{ 
                      width: point.wearDegree + '%',
                      background: getWearColor(point.wearDegree)
                    }"
                  ></div>
                  <span class="wear-value">{{ point.wearDegree }}</span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getWearClass(point.wearDegree)">
                  {{ getWearStatus(point.wearDegree) }}
                </span>
              </td>
              <td>{{ getWearSuggestion(point.wearDegree) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <footer class="footer">
      <p>盲道障碍物磨损度监控系统 v1.0.0 | 基于 Vue 3 + Spring Boot</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import WearScatterChart from './components/WearScatterChart.vue'
import { getDetectionPoints, formatDateToISO, getWearPrediction } from './utils/api.js'

const detectionPoints = ref([])
const predictionData = ref(null)
const selectedDate = ref('')
const isLoading = ref(false)
const error = ref('')

const today = new Date()
const todayStr = formatDateToISO(today)
const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
const thirtyDaysAgoStr = formatDateToISO(thirtyDaysAgo)

const maxDate = computed(() => todayStr)
const minDate = computed(() => thirtyDaysAgoStr)

const isToday = computed(() => {
  return selectedDate.value === todayStr
})

const isFirstDay = computed(() => {
  if (!selectedDate.value) return false
  return selectedDate.value <= thirtyDaysAgoStr
})

const isLastDay = computed(() => {
  if (!selectedDate.value) return true
  return selectedDate.value >= todayStr
})

const highWearCount = computed(() => {
  return detectionPoints.value.filter(p => p.wearDegree > 60).length
})

const mediumWearCount = computed(() => {
  return detectionPoints.value.filter(p => p.wearDegree > 30 && p.wearDegree <= 60).length
})

const lowWearCount = computed(() => {
  return detectionPoints.value.filter(p => p.wearDegree <= 30).length
})

const averageWear = computed(() => {
  if (!detectionPoints.value.length) return 0
  const sum = detectionPoints.value.reduce((acc, p) => acc + p.wearDegree, 0)
  return Math.round(sum / detectionPoints.value.length)
})

const getWearColor = (wear) => {
  if (wear <= 30) return '#52c41a'
  if (wear <= 60) return '#faad14'
  return '#f5222d'
}

const getWearClass = (wear) => {
  if (wear <= 30) return 'low'
  if (wear <= 60) return 'medium'
  return 'high'
}

const getWearStatus = (wear) => {
  if (wear <= 30) return '低磨损'
  if (wear <= 60) return '中磨损'
  return '高磨损'
}

const getWearSuggestion = (wear) => {
  if (wear <= 30) return '正常维护'
  if (wear <= 60) return '建议检查'
  return '急需修复'
}

const fetchData = async (dateStr = null) => {
  isLoading.value = true
  error.value = ''
  try {
    const data = await getDetectionPoints(dateStr)
    detectionPoints.value = data
  } catch (err) {
    console.error('获取数据失败:', err)
    error.value = '获取数据失败，请检查后端服务是否启动'
  } finally {
    isLoading.value = false
  }
}

const fetchPrediction = async () => {
  try {
    const data = await getWearPrediction()
    predictionData.value = data
  } catch (err) {
    console.warn('获取预测数据失败:', err)
  }
}

const handleDateChange = () => {
  if (selectedDate.value) {
    fetchData(selectedDate.value)
  }
}

const setToday = () => {
  selectedDate.value = todayStr
  fetchData(selectedDate.value)
}

const setYesterday = () => {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  selectedDate.value = formatDateToISO(yesterday)
  fetchData(selectedDate.value)
}

const setPrevDay = () => {
  if (!selectedDate.value) return
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const prev = new Date(y, m - 1, d - 1)
  const prevStr = formatDateToISO(prev)
  if (prevStr >= thirtyDaysAgoStr) {
    selectedDate.value = prevStr
    fetchData(selectedDate.value)
  }
}

const setNextDay = () => {
  if (!selectedDate.value) return
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  const nextStr = formatDateToISO(next)
  if (nextStr <= todayStr) {
    selectedDate.value = nextStr
    fetchData(selectedDate.value)
  }
}

onMounted(() => {
  setToday()
  fetchPrediction()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
}

.logo h1 {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #52c41a;
  animation: pulse 2s infinite;
}

.status-dot.active {
  background: #faad14;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  color: #ccc;
  font-size: 14px;
}

.main-content {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.date-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-control label {
  color: #fff;
  font-weight: 500;
}

.date-control input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.date-control input::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.date-shortcuts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.date-shortcuts button {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.date-shortcuts button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.date-shortcuts button.active {
  background: #1890ff;
  border-color: #1890ff;
}

.date-shortcuts button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-message {
  background: rgba(245, 34, 45, 0.15);
  border: 1px solid rgba(245, 34, 45, 0.3);
  color: #ff7875;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}

.data-table {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 24px;
}

.table-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table-header h3 {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 16px 24px;
  text-align: left;
  color: #fff;
}

th {
  background: rgba(0, 0, 0, 0.2);
  color: #ccc;
  font-weight: 500;
  font-size: 13px;
  text-transform: uppercase;
}

tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

tr:last-child {
  border-bottom: none;
}

tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.wear-bar-container {
  position: relative;
  width: 120px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.wear-bar {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.wear-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  font-weight: bold;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.high {
  background: rgba(245, 34, 45, 0.2);
  color: #ff7875;
}

.status-badge.medium {
  background: rgba(250, 173, 20, 0.2);
  color: #ffc53d;
}

.status-badge.low {
  background: rgba(82, 196, 26, 0.2);
  color: #73d13d;
}

.footer {
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  text-align: center;
}

.footer p {
  color: #666;
  font-size: 12px;
}
</style>
