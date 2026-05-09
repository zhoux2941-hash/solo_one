<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>小区泳池泳道拥挤容忍度可视化看板</h1>
      <p class="subtitle">实时监控各泳道拥挤容忍度指数</p>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>数据加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchAllData" class="retry-btn">重新加载</button>
    </div>

    <div v-else class="dashboard-content">
      <div class="date-selector-section">
        <div class="date-selector-card">
          <label class="date-label">📅 选择日期查看数据：</label>
          <input
            type="date"
            v-model="selectedDate"
            @change="handleDateChange"
            class="date-input"
            :min="minDate"
            :max="maxDate"
          />
          <span v-if="currentDataDate" class="current-date-badge">
            当前显示：{{ currentDataDate }}
          </span>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card shallow-zone">
          <div class="stat-icon">🏊</div>
          <div class="stat-info">
            <h3>浅水区</h3>
            <p class="stat-value">{{ shallowAverage }}</p>
            <p class="stat-label">平均容忍度</p>
          </div>
        </div>
        <div class="stat-card deep-zone">
          <div class="stat-icon">🏊‍♂️</div>
          <div class="stat-info">
            <h3>深水区</h3>
            <p class="stat-value">{{ deepAverage }}</p>
            <p class="stat-label">平均容忍度</p>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>泳池整体</h3>
            <p class="stat-value">{{ overallAverage }}</p>
            <p class="stat-label">平均容忍度</p>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card radar-card">
          <RadarChart :data="laneData" />
        </div>
        <div class="chart-card line-card">
          <LineChart :data="dailyAverages" />
        </div>
      </div>

      <div class="data-table-section">
        <h2>泳道详情</h2>
        <div class="table-container">
          <table class="lane-table">
            <thead>
              <tr>
                <th>泳道名称</th>
                <th>区域</th>
                <th>拥挤容忍度指数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lane in laneData" :key="lane.laneName"
                  :class="{ 'shallow-row': lane.zone === 'shallower', 'deep-row': lane.zone === 'deeper' }">
                <td>{{ lane.laneName }}</td>
                <td>
                  <span :class="['zone-badge', lane.zone === 'shallower' ? 'shallow' : 'deep']">
                    {{ lane.zone === 'shallower' ? '浅水区' : '深水区' }}
                  </span>
                </td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill"
                         :style="{ width: lane.toleranceValue + '%', backgroundColor: getProgressColor(lane.toleranceValue) }">
                    </div>
                    <span class="progress-text">{{ lane.toleranceValue }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', getStatusClass(lane.toleranceValue)]">
                    {{ getStatusText(lane.toleranceValue) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="legend-section">
        <h3>说明</h3>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-color low"></span>
            <span>低容忍度 (0-33): 游泳者介意拥挤，建议减少该区域人数</span>
          </div>
          <div class="legend-item">
            <span class="legend-color medium"></span>
            <span>中容忍度 (34-66): 游泳者有一定容忍度</span>
          </div>
          <div class="legend-item">
            <span class="legend-color high"></span>
            <span>高容忍度 (67-100): 游泳者不介意拥挤，可容纳更多人</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import RadarChart from './components/RadarChart.vue'
import LineChart from './components/LineChart.vue'
import { getLanesByDate, getDailyAverages } from './api/lane'

const laneData = ref([])
const dailyAverages = ref([])
const loading = ref(true)
const error = ref('')
const selectedDate = ref('')
const currentDataDate = ref('')

const minDate = ref('2026-05-01')
const maxDate = ref('2026-05-09')

const shallowAverage = computed(() => {
  const shallowLanes = laneData.value.filter(lane => lane.zone === 'shallower')
  if (shallowLanes.length === 0) return 0
  const sum = shallowLanes.reduce((acc, lane) => acc + lane.toleranceValue, 0)
  return Math.round(sum / shallowLanes.length)
})

const deepAverage = computed(() => {
  const deepLanes = laneData.value.filter(lane => lane.zone === 'deeper')
  if (deepLanes.length === 0) return 0
  const sum = deepLanes.reduce((acc, lane) => acc + lane.toleranceValue, 0)
  return Math.round(sum / deepLanes.length)
})

const overallAverage = computed(() => {
  if (laneData.value.length === 0) return 0
  const sum = laneData.value.reduce((acc, lane) => acc + lane.toleranceValue, 0)
  return Math.round(sum / laneData.value.length)
})

const getProgressColor = (value) => {
  if (value <= 33) return '#ff6b6b'
  if (value <= 66) return '#ffa94d'
  return '#51cf66'
}

const getStatusClass = (value) => {
  if (value <= 33) return 'low'
  if (value <= 66) return 'medium'
  return 'high'
}

const getStatusText = (value) => {
  if (value <= 33) return '低容忍度'
  if (value <= 66) return '中容忍度'
  return '高容忍度'
}

const fetchLaneData = async (date) => {
  try {
    const response = await getLanesByDate(date)
    laneData.value = response.data
    if (response.data.length > 0 && response.data[0].recordDate) {
      currentDataDate.value = response.data[0].recordDate
    }
  } catch (err) {
    console.error('Error fetching lane data:', err)
    throw err
  }
}

const fetchDailyAverages = async () => {
  try {
    const response = await getDailyAverages(minDate.value, maxDate.value)
    dailyAverages.value = response.data
  } catch (err) {
    console.error('Error fetching daily averages:', err)
    throw err
  }
}

const fetchAllData = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      fetchLaneData(selectedDate.value || maxDate.value),
      fetchDailyAverages()
    ])
  } catch (err) {
    error.value = '数据加载失败，请检查后端服务是否启动'
  } finally {
    loading.value = false
  }
}

const handleDateChange = async () => {
  if (selectedDate.value) {
    loading.value = true
    try {
      await fetchLaneData(selectedDate.value)
    } catch (err) {
      error.value = '该日期数据加载失败'
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  selectedDate.value = maxDate.value
  fetchAllData()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  color: #fff;
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;
  color: #fff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: #fff;
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}

.retry-btn:hover {
  transform: scale(1.05);
}

.date-selector-section {
  margin-bottom: 20px;
}

.date-selector-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.date-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.date-input {
  padding: 10px 16px;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.date-input:hover {
  border-color: #667eea;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.current-date-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3rem;
}

.stat-info h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.shallow-zone .stat-value {
  color: #ff6b6b;
}

.deep-zone .stat-value {
  color: #4c6ef5;
}

.total .stat-value {
  color: #51cf66;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.data-table-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.data-table-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.table-container {
  overflow-x: auto;
}

.lane-table {
  width: 100%;
  border-collapse: collapse;
}

.lane-table th,
.lane-table td {
  padding: 14px 16px;
  text-align: left;
}

.lane-table th {
  background: #f8f9fa;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.lane-table td {
  border-bottom: 1px solid #e9ecef;
}

.lane-table tr:hover {
  background: #f8f9fa;
}

.shallow-row {
  background: rgba(255, 107, 107, 0.05);
}

.deep-row {
  background: rgba(76, 110, 245, 0.05);
}

.zone-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.zone-badge.shallow {
  background: rgba(255, 107, 107, 0.2);
  color: #c92a2a;
}

.zone-badge.deep {
  background: rgba(76, 110, 245, 0.2);
  color: #1864ab;
}

.progress-bar {
  position: relative;
  height: 28px;
  background: #e9ecef;
  border-radius: 14px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 14px;
  transition: width 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  color: #333;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}

.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.low {
  background: rgba(255, 107, 107, 0.2);
  color: #c92a2a;
}

.status-badge.medium {
  background: rgba(255, 169, 77, 0.2);
  color: #d9480f;
}

.status-badge.high {
  background: rgba(81, 207, 102, 0.2);
  color: #2f9e44;
}

.legend-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.legend-section h3 {
  color: #333;
  margin-bottom: 16px;
  font-size: 1.2rem;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #555;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.legend-color.low {
  background: #ff6b6b;
}

.legend-color.medium {
  background: #ffa94d;
}

.legend-color.high {
  background: #51cf66;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.8rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .lane-table th,
  .lane-table td {
    padding: 10px 8px;
    font-size: 0.9rem;
  }

  .date-selector-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
