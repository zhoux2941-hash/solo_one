<template>
  <div class="heatmap-container">
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">后端状态:</span>
        <span :class="['status-badge', backendHealthy ? 'healthy' : 'unhealthy']">
          {{ backendHealthy ? '● 正常' : '● 异常' }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">高温阈值:</span>
        <span class="threshold-value">{{ highTempThreshold }}℃</span>
      </div>
      <div class="status-item">
        <span class="status-label">更新时间:</span>
        <span class="timestamp">{{ formattedTimestamp }}</span>
      </div>
      <button @click="refreshData" class="refresh-btn" :disabled="isLoading">
        {{ isLoading ? '加载中...' : '🔄 刷新' }}
      </button>
    </div>

    <div v-if="currentAlarms.length > 0" class="alarm-banner">
      <span class="alarm-icon">⚠️</span>
      <span class="alarm-text">当前有 {{ currentAlarms.length }} 个高温报警!</span>
      <span class="alarm-detail">
        {{ currentAlarmsSummary }}
      </span>
    </div>

    <div class="heatmap-wrapper">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th class="corner-cell">层数\筒仓</th>
            <th v-for="silo in siloNames" :key="silo" class="silo-header">
              {{ silo }}号筒仓
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(layer, layerIndex) in layerNames" :key="layer">
            <th class="layer-header">{{ layer }}</th>
            <td 
              v-for="(silo, siloIndex) in siloNames" 
              :key="`${silo}-${layer}`"
              class="heatmap-cell"
              :class="{ 'has-alarm': isHighTemperature(siloIndex, layerIndex) }"
              :style="getCellStyle(getTemperature(siloIndex, layerIndex))"
              :title="getCellTitle(silo, layer, siloIndex, layerIndex)"
            >
              <div class="cell-content">
                <span v-if="isHighTemperature(siloIndex, layerIndex)" class="alarm-arrow">
                  ⬆️
                </span>
                <span class="temp-value">
                  {{ formatTemperature(getTemperature(siloIndex, layerIndex)) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="legend">
      <div class="legend-title">温度图例 (℃)</div>
      <div class="legend-scale">
        <div 
          v-for="(item, index) in legendItems" 
          :key="index" 
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <span class="legend-label">{{ item.label }}</span>
        </div>
        <div class="legend-item alarm-legend">
          <span class="alarm-arrow-legend">⬆️</span>
          <span class="legend-label">高温报警</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { temperatureApi, alarmApi } from '../api/temperature'

const temperatureMatrix = ref([])
const siloNames = ref(['A', 'B', 'C', 'D'])
const layerNames = ref(['顶层', '第4层', '第3层', '第2层', '底层'])
const timestamp = ref(null)
const isLoading = ref(false)
const backendHealthy = ref(false)
const highTempThreshold = ref(30.0)

let refreshInterval = null

const formattedTimestamp = computed(() => {
  if (!timestamp.value) return '--'
  const date = new Date(timestamp.value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

const legendItems = computed(() => [
  { label: '< 17', color: '#2196F3' },
  { label: '17-20', color: '#4CAF50' },
  { label: '20-23', color: '#FFC107' },
  { label: '23-26', color: '#FF9800' },
  { label: '26-29', color: '#FF5722' },
  { label: '> 29', color: '#f44336' }
])

const currentAlarms = computed(() => {
  const alarms = []
  if (!temperatureMatrix.value) return alarms
  
  for (let siloIndex = 0; siloIndex < temperatureMatrix.value.length; siloIndex++) {
    const siloTemps = temperatureMatrix.value[siloIndex]
    for (let layerIndex = 0; layerIndex < siloTemps.length; layerIndex++) {
      const temp = siloTemps[layerIndex]
      if (temp > highTempThreshold.value) {
        alarms.push({
          silo: siloNames.value[siloIndex],
          layer: layerNames.value[layerIndex],
          temperature: temp
        })
      }
    }
  }
  return alarms
})

const currentAlarmsSummary = computed(() => {
  if (currentAlarms.value.length === 0) return ''
  return currentAlarms.value
    .map(a => `${a.silo}号-${a.layer}: ${a.temperature}℃`)
    .join(' | ')
})

function formatTemperature(temp) {
  if (temp === null || temp === undefined) return '--'
  return temp.toFixed(1)
}

function getTemperature(siloIndex, layerIndex) {
  if (!temperatureMatrix.value || 
      !temperatureMatrix.value[siloIndex] || 
      temperatureMatrix.value[siloIndex][layerIndex] === undefined) {
    return null
  }
  return temperatureMatrix.value[siloIndex][layerIndex]
}

function isHighTemperature(siloIndex, layerIndex) {
  const temp = getTemperature(siloIndex, layerIndex)
  return temp !== null && temp > highTempThreshold.value
}

function getCellStyle(temp) {
  if (temp === null || temp === undefined) {
    return { backgroundColor: '#ccc', color: '#666' }
  }

  let backgroundColor
  let textColor = '#ffffff'

  if (temp < 17) {
    backgroundColor = '#2196F3'
  } else if (temp < 20) {
    backgroundColor = '#4CAF50'
  } else if (temp < 23) {
    backgroundColor = '#FFC107'
    textColor = '#333333'
  } else if (temp < 26) {
    backgroundColor = '#FF9800'
  } else if (temp < 29) {
    backgroundColor = '#FF5722'
  } else {
    backgroundColor = '#f44336'
  }

  return {
    backgroundColor,
    color: textColor
  }
}

function getCellTitle(silo, layer, siloIndex, layerIndex) {
  const temp = getTemperature(siloIndex, layerIndex)
  let title = `${silo}号筒仓 - ${layer}: ${formatTemperature(temp)}℃`
  if (isHighTemperature(siloIndex, layerIndex)) {
    title += ` ⚠️ 超过阈值(${highTempThreshold.value}℃)`
  }
  return title
}

async function loadThreshold() {
  try {
    const data = await alarmApi.getThreshold()
    if (data.highTemperatureThreshold) {
      highTempThreshold.value = data.highTemperatureThreshold
    }
  } catch (error) {
    console.warn('获取阈值失败，使用默认值:', error)
  }
}

async function checkHealth() {
  const healthy = await temperatureApi.healthCheck()
  backendHealthy.value = healthy
}

async function fetchTemperatureData() {
  isLoading.value = true
  try {
    const data = await temperatureApi.getCurrentTemperature()
    temperatureMatrix.value = data.temperatureMatrix
    siloNames.value = data.siloNames
    layerNames.value = data.layerNames
    timestamp.value = data.timestamp
    backendHealthy.value = true
  } catch (error) {
    console.error('获取温度数据失败:', error)
    backendHealthy.value = false
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await fetchTemperatureData()
}

onMounted(async () => {
  await loadThreshold()
  await checkHealth()
  await fetchTemperatureData()
  
  refreshInterval = setInterval(async () => {
    await checkHealth()
    await fetchTemperatureData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.heatmap-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 900px;
  width: 100%;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-badge {
  font-weight: bold;
  font-size: 0.95rem;
}

.status-badge.healthy {
  color: #4CAF50;
}

.status-badge.unhealthy {
  color: #f44336;
}

.threshold-value {
  font-weight: bold;
  color: #f44336;
  font-family: 'Courier New', monospace;
}

.timestamp {
  font-family: 'Courier New', monospace;
  color: #333;
}

.refresh-btn {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alarm-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border-radius: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.alarm-icon {
  font-size: 1.5rem;
}

.alarm-text {
  font-weight: bold;
  font-size: 1.1rem;
}

.alarm-detail {
  font-size: 0.9rem;
  opacity: 0.95;
}

.heatmap-wrapper {
  overflow-x: auto;
}

.heatmap-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.heatmap-table th,
.heatmap-table td {
  padding: 1.5rem;
  text-align: center;
  border: 2px solid #e0e0e0;
}

.corner-cell {
  background: #f0f0f0;
  font-weight: 600;
  color: #555;
}

.silo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.layer-header {
  background: #f0f0f0;
  font-weight: 600;
  color: #555;
  width: 100px;
}

.heatmap-cell {
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 120px;
  position: relative;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.heatmap-cell.has-alarm {
  border: 3px solid #f44336;
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
  animation: alarm-pulse 1.5s infinite;
}

@keyframes alarm-pulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(244, 67, 54, 0.8);
  }
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.alarm-arrow {
  font-size: 1.2rem;
  animation: arrow-bounce 0.6s infinite;
}

@keyframes arrow-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.temp-value {
  font-size: 1.4rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.legend {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.legend-title {
  font-weight: 600;
  color: #555;
  margin-bottom: 0.8rem;
  text-align: center;
}

.legend-scale {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-color {
  width: 30px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.legend-label {
  font-size: 0.85rem;
  color: #666;
}

.alarm-legend {
  margin-left: 0.5rem;
  padding-left: 0.8rem;
  border-left: 2px solid #ddd;
}

.alarm-arrow-legend {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .heatmap-table th,
  .heatmap-table td {
    padding: 0.8rem;
  }

  .temp-value {
    font-size: 1rem;
  }

  .status-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .alarm-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
