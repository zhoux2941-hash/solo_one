<template>
  <div class="grid-container">
    <div class="grid-header">
      <div class="empty-cell"></div>
      <div v-for="col in columns" :key="col" class="column-label">{{ col }}</div>
    </div>
    
    <div v-for="row in rows" :key="row" class="grid-row">
      <div class="row-label">{{ row }}</div>
      <div
        v-for="col in columns"
        :key="`${col}-${row}`"
        class="cell"
        :class="{ 'danger-prediction': isDangerPrediction(col, row) }"
        :style="{ backgroundColor: getCellColor(col, row) }"
        @mouseenter="showTooltip($event, col, row)"
        @mouseleave="hideTooltip"
      >
        <span class="cell-id">{{ col }}{{ row }}</span>
        <span v-if="isDangerPrediction(col, row)" class="warning-icon">⚠</span>
      </div>
    </div>
    
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-header">格口: {{ tooltip.cellId }}</div>
      <div class="tooltip-score">当前疲劳度: {{ tooltip.score }}</div>
      <div class="tooltip-status">状态: {{ getStatusLabel(tooltip.score) }}</div>
      <div v-if="tooltip.prediction" class="tooltip-prediction">
        <div class="prediction-title">🔮 预测信息</div>
        <div class="prediction-item">日均增量: {{ tooltip.prediction.averageDailyIncrement.toFixed(1) }}</div>
        <div v-if="tooltip.prediction.willReachDangerThreshold" class="danger-warning">
          ⚠ 预计{{ formatDate(tooltip.prediction.predictedDangerDate) }}达到危险阈值
        </div>
        <div class="prediction-risk">风险等级: {{ tooltip.prediction.riskLevel }}</div>
      </div>
    </div>
    
    <div v-if="dangerPredictions.length > 0" class="danger-list-section">
      <h3 class="danger-list-title">🚨 高频使用格口预测（未来3天可能达到危险阈值）</h3>
      <div class="danger-list">
        <div v-for="pred in dangerPredictions" :key="pred.cellId" class="danger-item">
          <div class="danger-cell-id">{{ pred.cellId }}</div>
          <div class="danger-info">
            <div>当前疲劳度: {{ pred.currentFatigue }}</div>
            <div>日均增量: {{ pred.averageDailyIncrement.toFixed(1) }}</div>
            <div class="danger-date">预计{{ formatDate(pred.predictedDangerDate) }}达到危险阈值</div>
          </div>
          <div class="danger-suggestion">{{ pred.suggestion }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'

const columns = ['A', 'B', 'C', 'D', 'E', 'F']
const rows = [1, 2, 3, 4, 5]

const cellData = ref(new Map())
const predictions = ref(new Map())
const dangerPredictions = ref([])

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  cellId: '',
  score: 0,
  prediction: null
})

onMounted(() => {
  fetchAllData()
})

async function fetchAllData() {
  try {
    const [fatigueResponse, predictionsResponse] = await Promise.all([
      axios.get('/api/cabinet/fatigue'),
      axios.get('/api/cabinet/predictions')
    ])
    
    const fatigueData = fatigueResponse.data
    fatigueData.forEach(cell => {
      cellData.value.set(cell.cellId, cell.fatigueScore)
    })
    
    const predictionsData = predictionsResponse.data
    predictionsData.forEach(pred => {
      predictions.value.set(pred.cellId, pred)
    })
    
    dangerPredictions.value = predictionsData.filter(p => p.willReachDangerThreshold)
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

function getCellColor(col, row) {
  const cellId = `${col}${row}`
  const score = cellData.value.get(cellId) || 0
  
  if (score <= 30) {
    return '#4CAF50'
  } else if (score <= 70) {
    return '#FF9800'
  } else {
    return '#f44336'
  }
}

function getStatusLabel(score) {
  if (score <= 30) {
    return '正常'
  } else if (score <= 70) {
    return '关注'
  } else {
    return '警告'
  }
}

function isDangerPrediction(col, row) {
  const cellId = `${col}${row}`
  const prediction = predictions.value.get(cellId)
  return prediction && prediction.willReachDangerThreshold
}

function showTooltip(event, col, row) {
  const cellId = `${col}${row}`
  const score = cellData.value.get(cellId) || 0
  const prediction = predictions.value.get(cellId) || null
  
  tooltip.cellId = cellId
  tooltip.score = score
  tooltip.prediction = prediction
  tooltip.x = event.clientX + 15
  tooltip.y = event.clientY + 15
  tooltip.visible = true
}

function hideTooltip() {
  tooltip.visible = false
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.grid-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
}

.grid-header {
  display: grid;
  grid-template-columns: 60px repeat(6, 1fr);
  gap: 5px;
}

.empty-cell {
  width: 60px;
}

.column-label {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
  color: #333;
  padding: 10px;
}

.grid-row {
  display: grid;
  grid-template-columns: 60px repeat(6, 1fr);
  gap: 5px;
  align-items: center;
}

.row-label {
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
  color: #333;
  width: 60px;
}

.cell {
  aspect-ratio: 1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.cell:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.cell.danger-prediction {
  border: 3px solid #ff1744;
  box-shadow: 0 0 10px rgba(255, 23, 68, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 23, 68, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 23, 68, 0.8);
  }
}

.cell-id {
  font-weight: bold;
  font-size: 1.5rem;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.warning-icon {
  font-size: 0.9rem;
  color: #fff;
  margin-top: 2px;
}

.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 15px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 1000;
  min-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.tooltip-header {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
}

.tooltip-score {
  margin-bottom: 5px;
  font-size: 1rem;
}

.tooltip-status {
  font-size: 1rem;
  color: #4CAF50;
  margin-bottom: 10px;
}

.tooltip-prediction {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 10px;
}

.prediction-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #64B5F6;
}

.prediction-item {
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: #ccc;
}

.danger-warning {
  background: rgba(255, 23, 68, 0.2);
  padding: 5px 8px;
  border-radius: 4px;
  margin: 8px 0;
  color: #ff5252;
  font-weight: bold;
}

.prediction-risk {
  font-size: 0.9rem;
  color: #FFD54F;
}

.danger-list-section {
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 23, 68, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 23, 68, 0.2);
}

.danger-list-title {
  text-align: center;
  color: #d32f2f;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.danger-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.danger-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ff1744;
  transition: transform 0.2s;
}

.danger-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.danger-cell-id {
  font-weight: bold;
  font-size: 1.2rem;
  color: #d32f2f;
  margin-bottom: 8px;
}

.danger-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
}

.danger-date {
  color: #d32f2f;
  font-weight: bold;
}

.danger-suggestion {
  font-size: 0.85rem;
  color: #666;
  background: #f5f5f5;
  padding: 8px 10px;
  border-radius: 4px;
  line-height: 1.4;
}
</style>
