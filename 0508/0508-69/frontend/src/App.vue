<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <span class="title-icon">🐠</span>
          水族馆水质pH值异常检测仪表板
        </h1>
        <div class="header-info">
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ currentTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">正常范围</span>
            <span class="info-value range">7.8 ~ 8.4</span>
          </div>
          <div class="info-item">
            <span class="info-label">WebSocket</span>
            <span class="info-value" :class="wsConnected ? 'connected' : 'disconnected'">
              {{ wsConnected ? '● 已连接' : '○ 未连接' }}
            </span>
          </div>
          <button class="refresh-btn" @click="refreshData" :disabled="loading">
            {{ loading ? '加载中...' : '🔄 刷新数据' }}
          </button>
        </div>
      </div>
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-icon">📊</span>
          <div class="summary-text">
            <span class="summary-label">展缸总数</span>
            <span class="summary-value">{{ tanksData.length }}</span>
          </div>
        </div>
        <div class="summary-item normal">
          <span class="summary-icon">✅</span>
          <div class="summary-text">
            <span class="summary-label">正常展缸</span>
            <span class="summary-value">{{ normalCount }}</span>
          </div>
        </div>
        <div class="summary-item warning">
          <span class="summary-icon">⚠️</span>
          <div class="summary-text">
            <span class="summary-label">异常展缸</span>
            <span class="summary-value">{{ abnormalCount }}</span>
          </div>
        </div>
        <div class="summary-item rate">
          <span class="summary-icon">📈</span>
          <div class="summary-text">
            <span class="summary-label">整体异常率</span>
            <span class="summary-value" :class="{ danger: overallAbnormalRate > 10 }">
              {{ overallAbnormalRate.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <AlertNotification
        v-if="alerts.length > 0 || !loading"
        :alerts="alerts"
        @dismiss="dismissAlert"
        @clear="clearAlerts"
      />

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载数据...</p>
      </div>

      <div v-else class="tanks-grid">
        <TankCard
          v-for="(tank, index) in sortedTanks"
          :key="tank.tankName"
          :tankData="tank"
          :index="index"
        />
      </div>
    </main>

    <footer class="dashboard-footer">
      <p>数据每整点自动更新 | 实时告警每10秒推送 | 历史数据保留7天</p>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDashboardData } from './api'
import TankCard from './components/TankCard.vue'
import AlertNotification from './components/AlertNotification.vue'
import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'

let stompClient = null
let alertIdCounter = 0
const MAX_ALERTS = 50

export default {
  name: 'App',
  components: {
    TankCard,
    AlertNotification
  },
  setup() {
    const tanksData = ref([])
    const loading = ref(false)
    const currentTime = ref('')
    const wsConnected = ref(false)
    const alerts = ref([])
    let refreshInterval = null
    let reconnectTimer = null

    const sortedTanks = computed(() => {
      return [...tanksData.value].sort((a, b) => {
        if (a.abnormalCount === 0 && b.abnormalCount > 0) return 1
        if (a.abnormalCount > 0 && b.abnormalCount === 0) return -1
        return b.abnormalRate - a.abnormalRate
      })
    })

    const normalCount = computed(() => {
      return tanksData.value.filter(t => t.abnormalCount === 0).length
    })

    const abnormalCount = computed(() => {
      return tanksData.value.filter(t => t.abnormalCount > 0).length
    })

    const overallAbnormalRate = computed(() => {
      if (tanksData.value.length === 0) return 0
      const totalRecords = tanksData.value.reduce((sum, t) => sum + t.totalCount, 0)
      const totalAbnormal = tanksData.value.reduce((sum, t) => sum + t.abnormalCount, 0)
      return totalRecords > 0 ? (totalAbnormal / totalRecords) * 100 : 0
    })

    const updateCurrentTime = () => {
      const now = new Date()
      currentTime.value = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const refreshData = async () => {
      loading.value = true
      try {
        const res = await getDashboardData()
        if (res.data && res.data.code === 200) {
          tanksData.value = res.data.data
        }
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        loading.value = false
        updateCurrentTime()
      }
    }

    const connectWebSocket = () => {
      const socket = new SockJS('/ws/ph-alerts')
      stompClient = Stomp.over(socket)
      stompClient.debug = () => {}

      stompClient.connect(
        {},
        (frame) => {
          console.log('WebSocket 连接成功')
          wsConnected.value = true
          
          stompClient.subscribe('/topic/ph-alerts', (message) => {
            try {
              const alert = JSON.parse(message.body)
              addAlert(alert)
            } catch (e) {
              console.error('解析告警消息失败:', e)
            }
          })
        },
        (error) => {
          console.log('WebSocket 连接失败:', error)
          wsConnected.value = false
          scheduleReconnect()
        }
      )
    }

    const scheduleReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      reconnectTimer = setTimeout(() => {
        console.log('尝试重新连接WebSocket...')
        connectWebSocket()
      }, 5000)
    }

    const addAlert = (alert) => {
      const newAlert = {
        ...alert,
        id: ++alertIdCounter
      }
      
      alerts.value.unshift(newAlert)
      
      if (alerts.value.length > MAX_ALERTS) {
        alerts.value = alerts.value.slice(0, MAX_ALERTS)
      }
      
      if (Notification.permission === 'granted') {
        showBrowserNotification(newAlert)
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showBrowserNotification(newAlert)
          }
        })
      }
    }

    const showBrowserNotification = (alert) => {
      const title = `⚠️ ${alert.tankName} - ${alert.alertType}`
      const options = {
        body: `当前pH: ${alert.currentPh} | ${alert.suggestion}`,
        icon: '🐠',
        tag: alert.tankName
      }
      new Notification(title, options)
    }

    const dismissAlert = (id) => {
      alerts.value = alerts.value.filter(a => a.id !== id)
    }

    const clearAlerts = () => {
      alerts.value = []
    }

    onMounted(() => {
      refreshData()
      updateCurrentTime()
      connectWebSocket()
      
      refreshInterval = setInterval(() => {
        updateCurrentTime()
      }, 1000)
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (stompClient) {
        stompClient.disconnect()
      }
    })

    return {
      tanksData,
      sortedTanks,
      loading,
      currentTime,
      wsConnected,
      alerts,
      normalCount,
      abnormalCount,
      overallAbnormalRate,
      refreshData,
      dismissAlert,
      clearAlerts
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.info-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.info-value.range {
  color: #f59e0b;
}

.info-value.connected {
  color: #22c55e;
}

.info-value.disconnected {
  color: #64748b;
}

.refresh-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid #334155;
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
  border-color: #475569;
}

.summary-item.normal {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(22, 42, 32, 0.6);
}

.summary-item.warning {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(44, 35, 45, 0.6);
}

.summary-icon {
  font-size: 28px;
}

.summary-text {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
}

.summary-value.danger {
  color: #ef4444;
}

.dashboard-main {
  min-height: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tanks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.dashboard-footer {
  text-align: center;
  padding: 24px 0;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .summary-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }
  
  .dashboard-title {
    font-size: 22px;
  }
  
  .summary-bar {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-info {
    justify-content: flex-start;
  }
  
  .tanks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
