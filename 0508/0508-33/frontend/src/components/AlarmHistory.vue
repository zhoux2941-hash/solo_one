<template>
  <div class="alarm-history-container">
    <div class="header-row">
      <h2>📋 历史报警记录</h2>
      <div class="header-actions">
        <button 
          @click="acknowledgeAllAlarms" 
          class="ack-btn"
          :disabled="unacknowledgedCount === 0 || isProcessing"
        >
          {{ isProcessing ? '处理中...' : '确认所有报警' }}
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ totalAlarms }}</span>
        <span class="stat-label">总报警数</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-value">{{ unacknowledgedCount }}</span>
        <span class="stat-label">未确认</span>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item">
        <label>筒仓筛选:</label>
        <select v-model="selectedSilo" @change="loadAlarms(0)">
          <option value="all">全部筒仓</option>
          <option value="A">A号筒仓</option>
          <option value="B">B号筒仓</option>
          <option value="C">C号筒仓</option>
          <option value="D">D号筒仓</option>
        </select>
      </div>
      <div class="filter-item">
        <label>每页显示:</label>
        <select v-model="pageSize" @change="loadAlarms(0)">
          <option :value="10">10条</option>
          <option :value="20">20条</option>
          <option :value="50">50条</option>
        </select>
      </div>
      <button @click="loadAlarms(currentPage)" class="refresh-btn" :disabled="isLoading">
        {{ isLoading ? '加载中...' : '🔄 刷新' }}
      </button>
    </div>

    <div class="table-wrapper">
      <table class="alarm-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>报警时间</th>
            <th>筒仓</th>
            <th>层数</th>
            <th>温度 (℃)</th>
            <th>阈值 (℃)</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading && alarms.length === 0">
            <td colspan="8" class="loading-row">
              <div class="loading-spinner"></div>
              <span>加载中...</span>
            </td>
          </tr>
          <tr v-else-if="alarms.length === 0">
            <td colspan="8" class="empty-row">
              <span>📭 暂无报警记录</span>
            </td>
          </tr>
          <tr 
            v-for="(alarm, index) in alarms" 
            :key="alarm.id"
            :class="{ 'acknowledged': alarm.acknowledged }"
          >
            <td>{{ getRowIndex(index) }}</td>
            <td>{{ formatDateTime(alarm.alarmTime) }}</td>
            <td>
              <span class="silo-badge">{{ alarm.siloName }}号</span>
            </td>
            <td>{{ alarm.layerName }}</td>
            <td class="temp-cell">
              <span class="temp-value high">{{ alarm.temperature.toFixed(1) }}</span>
            </td>
            <td class="threshold-cell">{{ alarm.threshold }}</td>
            <td>
              <span :class="['status-badge', alarm.acknowledged ? 'acknowledged' : 'unacknowledged']">
                {{ alarm.acknowledged ? '✓ 已确认' : '⚠ 待确认' }}
              </span>
            </td>
            <td>
              <button 
                v-if="!alarm.acknowledged"
                @click="acknowledgeAlarm(alarm.id)"
                class="ack-btn small"
                :disabled="isProcessing"
              >
                确认
              </button>
              <span v-else class="no-action">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="loadAlarms(currentPage - 1)" 
        :disabled="currentPage === 0 || isLoading"
        class="page-btn"
      >
        ← 上一页
      </button>
      <span class="page-info">
        第 {{ currentPage + 1 }} / {{ totalPages }} 页 (共 {{ totalAlarms }} 条)
      </span>
      <button 
        @click="loadAlarms(currentPage + 1)" 
        :disabled="currentPage >= totalPages - 1 || isLoading"
        class="page-btn"
      >
        下一页 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { alarmApi } from '../api/temperature'

const alarms = ref([])
const selectedSilo = ref('all')
const pageSize = ref(20)
const currentPage = ref(0)
const totalPages = ref(1)
const totalAlarms = ref(0)
const unacknowledgedCount = ref(0)
const isLoading = ref(false)
const isProcessing = ref(false)

let refreshInterval = null

function formatDateTime(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getRowIndex(index) {
  return currentPage.value * pageSize.value + index + 1
}

async function loadStats() {
  try {
    const stats = await alarmApi.getAlarmStats()
    totalAlarms.value = stats.totalAlarms || 0
    unacknowledgedCount.value = stats.unacknowledgedCount || 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function loadAlarms(page = 0) {
  if (page < 0 || (totalPages.value > 1 && page >= totalPages.value)) return
  
  isLoading.value = true
  currentPage.value = page
  
  try {
    const response = await alarmApi.getAlarmHistory(selectedSilo.value, page, pageSize.value)
    alarms.value = response.content || []
    totalPages.value = response.totalPages || 1
    totalAlarms.value = response.totalElements || 0
  } catch (error) {
    console.error('加载报警历史失败:', error)
    alarms.value = []
  } finally {
    isLoading.value = false
  }
}

async function acknowledgeAlarm(id) {
  isProcessing.value = true
  try {
    await alarmApi.acknowledgeAlarm(id)
    await Promise.all([loadAlarms(currentPage.value), loadStats()])
  } catch (error) {
    console.error('确认报警失败:', error)
  } finally {
    isProcessing.value = false
  }
}

async function acknowledgeAllAlarms() {
  isProcessing.value = true
  try {
    await alarmApi.acknowledgeAllAlarms()
    await Promise.all([loadAlarms(currentPage.value), loadStats()])
  } catch (error) {
    console.error('确认所有报警失败:', error)
  } finally {
    isProcessing.value = false
  }
}

onMounted(async () => {
  await loadStats()
  await loadAlarms(0)
  
  refreshInterval = setInterval(async () => {
    await loadStats()
    await loadAlarms(currentPage.value)
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.alarm-history-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 1000px;
  width: 100%;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-row h2 {
  margin: 0;
  color: #333;
}

.stats-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  text-align: center;
}

.stat-card.warning {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-item label {
  font-weight: 500;
  color: #666;
}

.filter-item select {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-item select:focus {
  outline: none;
  border-color: #667eea;
}

.refresh-btn, .ack-btn, .page-btn {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ack-btn {
  background: #4CAF50;
  color: white;
}

.ack-btn:hover:not(:disabled) {
  background: #45a049;
}

.ack-btn.small {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.alarm-table {
  width: 100%;
  border-collapse: collapse;
}

.alarm-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.alarm-table td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.alarm-table tr:hover:not(.loading-row):not(.empty-row) {
  background: #f9f9f9;
}

.alarm-table tr.acknowledged {
  opacity: 0.7;
}

.loading-row, .empty-row {
  text-align: center;
}

.loading-row td, .empty-row td {
  padding: 3rem;
  color: #666;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.silo-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.temp-cell .temp-value.high {
  color: #f44336;
  font-weight: bold;
  font-size: 1.1rem;
}

.threshold-cell {
  color: #666;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.unacknowledged {
  background: #ffebee;
  color: #f44336;
}

.status-badge.acknowledged {
  background: #e8f5e9;
  color: #4CAF50;
}

.no-action {
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.page-btn {
  background: #f5f5f5;
  color: #333;
}

.page-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-row {
    flex-direction: column;
  }
  
  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
