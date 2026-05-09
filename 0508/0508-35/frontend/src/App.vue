<template>
  <div class="dashboard">
    <header class="header">
      <h1>🚻 公厕厕纸余量智能感知看板</h1>
      <div class="status-bar">
        <span class="last-update">最后更新: {{ lastUpdate }}</span>
        <span class="weekend-status" :class="{ weekend: isWeekend }">
          {{ isWeekend ? '🌞 周末模式(消耗快)' : '📅 工作日模式' }}
        </span>
      </div>
    </header>

    <main class="main-content">
      <div v-if="selectedToilet" class="detail-view">
        <div class="detail-header">
          <button class="back-btn" @click="selectedToilet = null">
            ← 返回公厕列表
          </button>
          <h2>{{ selectedToilet.name }}</h2>
          <span class="location">📍 {{ selectedToilet.location }}</span>
        </div>
        <div class="cubicles-grid">
          <div
            v-for="stall in selectedToilet.cubicles"
            :key="stall.id"
            class="stall-card"
          >
            <div class="stall-header">
              <span class="stall-code">厕位 {{ stall.code }}</span>
              <span class="stall-name">{{ stall.name }}</span>
            </div>
            <div class="paper-progress">
              <div
                class="progress-bar"
                :style="{ width: stall.paperLevel + '%' }"
                :class="getLevelClass(stall.paperLevel)"
              ></div>
            </div>
            <div class="paper-level" :class="getLevelClass(stall.paperLevel)">
              {{ stall.paperLevel }}%
            </div>
            <div class="last-update-stall">
              更新时间: {{ formatTime(stall.lastUpdate) }}
            </div>
            <button
              v-if="stall.paperLevel <= 20"
              class="refill-btn"
              @click.stop="handleRefill(stall.id)"
            >
              🔧 补充厕纸
            </button>
          </div>
        </div>
      </div>

      <div v-else class="toilets-grid">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>正在加载数据...</p>
        </div>
        
        <div v-else-if="error" class="error-container">
          <p class="error-icon">⚠️</p>
          <p class="error-message">获取数据失败</p>
          <button class="retry-btn" @click="fetchData">重新加载</button>
        </div>
        
        <div v-else-if="toilets.length === 0" class="empty-container">
          <p class="empty-icon">🚽</p>
          <p class="empty-message">暂无厕位数据</p>
        </div>
        
        <div
          v-else
          v-for="toilet in toilets"
          :key="toilet.id"
          class="toilet-card"
          @click="selectedToilet = toilet"
        >
          <div class="toilet-header">
            <span class="toilet-code">{{ toilet.code }}</span>
            <span class="toilet-name">{{ toilet.name }}</span>
          </div>
          <div class="toilet-location">📍 {{ toilet.location }}</div>
          <div class="toilet-summary">
            <div class="summary-title">厕位状态</div>
            <div class="summary-cubicles">
              <div
                v-for="stall in toilet.cubicles"
                :key="stall.id"
                class="summary-stall"
              >
                <span class="stall-label">{{ stall.code }}</span>
                <div class="mini-progress">
                  <div
                    class="mini-bar"
                    :style="{ width: stall.paperLevel + '%' }"
                    :class="getLevelClass(stall.paperLevel)"
                  ></div>
                </div>
                <span class="mini-level" :class="getLevelClass(stall.paperLevel)">
                  {{ stall.paperLevel }}%
                </span>
              </div>
            </div>
          </div>
          <div class="toilet-footer">点击查看详情 →</div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>数据每10秒自动刷新 | 周末模式余量消耗加快</p>
    </footer>

    <div
      v-if="alertCount > 0"
      class="alert-floating-ball"
      @click="showAlertModal = true"
    >
      <span class="alert-icon">🔔</span>
      <span class="alert-count">{{ alertCount }}</span>
    </div>

    <div v-if="showAlertModal" class="alert-modal-overlay" @click.self="showAlertModal = false">
      <div class="alert-modal">
        <div class="alert-modal-header">
          <h3>🚨 低余量预警列表</h3>
          <button class="modal-close-btn" @click="showAlertModal = false">✕</button>
        </div>
        <div class="alert-modal-body">
          <div v-if="alertsLoading" class="alert-loading">
            <div class="loading-spinner small"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="alerts.length === 0" class="alert-empty">
            <span class="alert-empty-icon">✅</span>
            <p>当前无低余量预警</p>
          </div>
          
          <div v-else class="alert-list">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-item"
            >
              <div class="alert-info">
                <span class="alert-position">{{ alert.position }}</span>
                <span class="alert-level low">剩余 {{ alert.paperLevel }}%</span>
              </div>
              <div class="alert-location">
                📍 {{ alert.location }}
              </div>
              <div class="alert-actions">
                <span class="alert-time">检测时间: {{ alert.detectTime }}</span>
                <button
                  class="refill-btn-small"
                  :disabled="refillingIds.includes(alert.id)"
                  @click="handleRefillFromAlert(alert.id)"
                >
                  {{ refillingIds.includes(alert.id) ? '补充中...' : '🔧 补充厕纸' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import toiletApi from './api/toilet'

const toilets = ref([])
const selectedToilet = ref(null)
const lastUpdate = ref('')
const refreshTimer = ref(null)
const loading = ref(true)
const error = ref(false)

const alertCount = ref(0)
const alerts = ref([])
const alertsLoading = ref(false)
const showAlertModal = ref(false)
const refillingIds = ref([])
const alertTimer = ref(null)

const isWeekend = (() => {
  const day = new Date().getDay()
  return day === 0 || day === 6
})()

const getLevelClass = (level) => {
  if (level <= 20) return 'low'
  if (level <= 50) return 'medium'
  return 'high'
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN')
}

const fetchData = async () => {
  loading.value = true
  error.value = false
  
  try {
    const response = await toiletApi.getAllToilets()
    if (response.data && response.data.data) {
      toilets.value = response.data.data
      lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
      
      if (selectedToilet.value) {
        const updated = response.data.data.find(t => t.id === selectedToilet.value.id)
        if (updated) {
          selectedToilet.value = updated
        }
      }
    }
  } catch (err) {
    console.error('获取数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const fetchAlerts = async () => {
  try {
    const response = await toiletApi.getAlerts()
    if (response.data && response.data.data) {
      alertCount.value = response.data.count || response.data.data.length
      alerts.value = response.data.data
    }
  } catch (err) {
    console.error('获取预警失败:', err)
  }
}

const handleRefill = async (stallId) => {
  if (refillingIds.value.includes(stallId)) return
  
  refillingIds.value.push(stallId)
  
  try {
    await toiletApi.refillPaper(stallId)
    await fetchData()
    await fetchAlerts()
  } catch (err) {
    console.error('补充厕纸失败:', err)
  } finally {
    refillingIds.value = refillingIds.value.filter(id => id !== stallId)
  }
}

const handleRefillFromAlert = async (stallId) => {
  await handleRefill(stallId)
}

const openAlertModal = async () => {
  showAlertModal.value = true
  alertsLoading.value = true
  await fetchAlerts()
  alertsLoading.value = false
}

onMounted(() => {
  fetchData()
  fetchAlerts()
  refreshTimer.value = setInterval(fetchData, 10000)
  alertTimer.value = setInterval(fetchAlerts, 15000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  if (alertTimer.value) {
    clearInterval(alertTimer.value)
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 0.9rem;
}

.last-update {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
}

.weekend-status {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
}

.weekend-status.weekend {
  background: rgba(255, 193, 7, 0.4);
}

.main-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.toilets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.toilet-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.toilet-card:hover {
  transform: translateY(-5px);
  border-color: #667eea;
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
}

.toilet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.toilet-code {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.85rem;
}

.toilet-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.toilet-location {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 15px;
}

.toilet-summary {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.summary-title {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 10px;
}

.summary-cubicles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-stall {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stall-label {
  width: 25px;
  font-weight: bold;
  color: #666;
}

.mini-progress {
  flex: 1;
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.mini-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.mini-bar.high {
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
}

.mini-bar.medium {
  background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%);
}

.mini-bar.low {
  background: linear-gradient(90deg, #f56565 0%, #e53e3e 100%);
}

.mini-level {
  width: 45px;
  text-align: right;
  font-weight: 600;
  font-size: 0.9rem;
}

.mini-level.high {
  color: #38a169;
}

.mini-level.medium {
  color: #dd6b20;
}

.mini-level.low {
  color: #e53e3e;
}

.toilet-footer {
  margin-top: 15px;
  text-align: right;
  color: #667eea;
  font-size: 0.85rem;
}

.detail-view {
  animation: fadeIn 0.3s ease;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #5a67d8;
}

.detail-header h2 {
  font-size: 1.5rem;
  color: #333;
}

.location {
  color: #666;
  margin-left: auto;
}

.cubicles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

.stall-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.stall-header {
  margin-bottom: 20px;
}

.stall-code {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.stall-name {
  color: #666;
  font-size: 0.9rem;
}

.paper-progress {
  width: 100%;
  height: 25px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.progress-bar.high {
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
}

.progress-bar.medium {
  background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%);
}

.progress-bar.low {
  background: linear-gradient(90deg, #f56565 0%, #e53e3e 100%);
  animation: pulse 1s infinite;
}

.paper-level {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.paper-level.high {
  color: #38a169;
}

.paper-level.medium {
  color: #dd6b20;
}

.paper-level.low {
  color: #e53e3e;
  animation: pulse 1s infinite;
}

.last-update-stall {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 15px;
}

.refill-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.refill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(56, 161, 105, 0.4);
}

.footer {
  text-align: center;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 900px) {
  .toilets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cubicles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .toilets-grid {
    grid-template-columns: 1fr;
  }
  
  .cubicles-grid {
    grid-template-columns: 1fr;
  }
}

.loading-container {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-message {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #e53e3e;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #5a67d8;
}

.empty-container {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-message {
  font-size: 1.3rem;
  color: #999;
}

.alert-floating-ball {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(229, 62, 62, 0.5);
  animation: float 3s ease-in-out infinite;
  z-index: 1000;
}

.alert-floating-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 35px rgba(229, 62, 62, 0.6);
}

.alert-icon {
  font-size: 24px;
}

.alert-count {
  font-size: 14px;
  font-weight: bold;
  color: white;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.alert-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.alert-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.alert-modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.alert-modal-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.alert-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #666;
}

.alert-empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.alert-empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-item {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  padding: 15px;
}

.alert-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-position {
  font-weight: bold;
  color: #e53e3e;
  font-size: 1.1rem;
}

.alert-level {
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.alert-level.low {
  background: #feb2b2;
  color: #c53030;
}

.alert-location {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.alert-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.alert-time {
  font-size: 0.8rem;
  color: #999;
}

.refill-btn-small {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.refill-btn-small:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(56, 161, 105, 0.4);
}

.refill-btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
