<template>
  <div class="dashboard">
    <header class="header">
      <h1>🌳 公园长椅阳光阴影统计看板</h1>
      <div class="controls">
        <div class="control-group">
          <label class="control-label">选择日期：</label>
          <input 
            type="date" 
            v-model="selectedDate" 
            @change="fetchStats"
            class="control-input"
          />
        </div>
        <div class="control-group">
          <label class="control-label">天气状况：</label>
          <div class="weather-buttons">
            <button 
              v-for="weather in weatherTypes" 
              :key="weather.code"
              @click="selectWeather(weather.code)"
              :class="['weather-btn', { active: selectedWeather === weather.code }]"
            >
              <span class="weather-icon">{{ getWeatherIcon(weather.code) }}</span>
              <span class="weather-text">{{ weather.description }}</span>
              <span class="weather-factor">×{{ weather.sunFactor }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div v-if="currentWeather" class="weather-banner">
      <div class="weather-info">
        <span class="weather-icon-large">{{ getWeatherIcon(selectedWeather) }}</span>
        <div>
          <div class="weather-title">当前天气模拟：{{ currentWeather.description }}</div>
          <div class="weather-detail">
            阳光系数 ×{{ currentWeather.sunFactor }}
            <span v-if="currentWeather.sunFactor > 1" class="trend up">↑ 阳光增强</span>
            <span v-else-if="currentWeather.sunFactor < 1" class="trend down">↓ 阳光减弱</span>
            <span v-else class="trend normal">正常</span>
          </div>
        </div>
      </div>
      <div class="cache-status" v-if="cacheStatus">
        <span class="cache-icon">💾</span>
        <span>{{ cacheStatus }}</span>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">长椅总数</div>
        <div class="card-value">{{ summary.totalBenches || 0 }}</div>
      </div>
      <div class="card sun">
        <div class="card-label">平均阳光时长</div>
        <div class="card-value">{{ summary.avgSunDurationMinutes || 0 }} <span class="unit">分钟</span></div>
      </div>
      <div class="card shadow">
        <div class="card-label">平均阴影占比</div>
        <div class="card-value">{{ summary.avgShadowPercentage || 0 }} <span class="unit">%</span></div>
      </div>
    </div>

    <div class="chart-container">
      <BenchChart :stats="statsList" />
    </div>

    <div class="area-container">
      <div class="area-section">
        <h2>🌅 东区长椅</h2>
        <BenchList :benches="eastBenches" />
      </div>
      <div class="area-section">
        <h2>🌇 西区长椅</h2>
        <BenchList :benches="westBenches" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { benchStatsApi } from './api/benchStats'
import BenchChart from './components/BenchChart.vue'
import BenchList from './components/BenchList.vue'

const statsList = ref([])
const summary = ref({})
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedWeather = ref('SUNNY')
const weatherTypes = ref([])
const cacheStatus = ref('')

const currentWeather = computed(() => {
  return weatherTypes.value.find(w => w.code === selectedWeather.value)
})

const eastBenches = computed(() => {
  return statsList.value.filter(s => s.area === '东区')
})

const westBenches = computed(() => {
  return statsList.value.filter(s => s.area === '西区')
})

const getWeatherIcon = (code) => {
  const icons = {
    'SUNNY': '☀️',
    'CLOUDY': '⛅',
    'OVERCAST': '☁️'
  }
  return icons[code] || '🌤️'
}

const selectWeather = (code) => {
  if (selectedWeather.value !== code) {
    selectedWeather.value = code
    fetchStats(true)
  }
}

const fetchWeatherTypes = async () => {
  try {
    const res = await benchStatsApi.getWeatherTypes()
    weatherTypes.value = res.data
  } catch (error) {
    console.error('获取天气类型失败:', error)
    weatherTypes.value = [
      { code: 'SUNNY', description: '晴天', sunFactor: 1.2 },
      { code: 'CLOUDY', description: '多云', sunFactor: 0.8 },
      { code: 'OVERCAST', description: '阴天', sunFactor: 0.4 }
    ]
  }
}

const fetchStats = async (isWeatherChange = false) => {
  cacheStatus.value = isWeatherChange ? '重新计算中...' : '加载中...'
  try {
    const startTime = Date.now()
    const [statsRes, summaryRes] = await Promise.all([
      benchStatsApi.getStatsByDate(selectedDate.value, selectedWeather.value),
      benchStatsApi.getSummary(selectedWeather.value)
    ])
    statsList.value = statsRes.data
    summary.value = summaryRes.data
    const duration = Date.now() - startTime
    cacheStatus.value = duration < 100 ? '📦 数据已缓存' : '✅ 数据已加载'
  } catch (error) {
    console.error('获取数据失败:', error)
    cacheStatus.value = '❌ 加载失败'
  }
}

onMounted(async () => {
  await fetchWeatherTypes()
  await fetchStats()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 28px;
  color: #333;
}

.controls {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  font-weight: 500;
  color: #555;
}

.control-input {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.control-input:focus {
  outline: none;
  border-color: #667eea;
}

.weather-buttons {
  display: flex;
  gap: 10px;
}

.weather-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
}

.weather-btn:hover {
  border-color: #667eea;
  background: #f8f7ff;
}

.weather-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.weather-btn.active .weather-text,
.weather-btn.active .weather-factor {
  color: white;
}

.weather-icon {
  font-size: 24px;
}

.weather-text {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.weather-factor {
  font-size: 10px;
  color: #888;
}

.weather-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.weather-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-icon-large {
  font-size: 40px;
}

.weather-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.weather-detail {
  font-size: 13px;
  opacity: 0.9;
}

.trend {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.trend.up {
  background: rgba(255, 255, 255, 0.2);
  color: #ffeb3b;
}

.trend.down {
  background: rgba(255, 255, 255, 0.2);
  color: #81d4fa;
}

.trend.normal {
  background: rgba(255, 255, 255, 0.2);
}

.cache-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
}

.cache-icon {
  font-size: 18px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-4px);
}

.card.sun {
  border-left: 4px solid #FF6B6B;
}

.card.shadow {
  border-left: 4px solid #4ECDC4;
}

.card-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #333;
}

.card-value .unit {
  font-size: 16px;
  color: #888;
  font-weight: normal;
}

.chart-container {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.area-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.area-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.area-section h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .area-container {
    grid-template-columns: 1fr;
  }
  
  .weather-buttons {
    flex-wrap: wrap;
  }
}
</style>
