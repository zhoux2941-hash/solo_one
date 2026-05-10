<template>
  <div class="overdue-list-page">
    <div class="page-header">
      <h2>🚨 逾期未浇水绿植</h2>
      <div class="alert-badge" v-if="overduePlants.length > 0">
        {{ overduePlants.length }} 盆需要立即关注
      </div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="overduePlants.length === 0" class="empty-state">
      <div class="empty-icon">🌿</div>
      <h3>所有绿植状态良好！</h3>
      <p>没有逾期未浇水的绿植</p>
    </div>

    <div v-else class="plant-grid">
      <PlantCard
        v-for="plant in overduePlants"
        :key="plant.id"
        :plant="plant"
        @watered="handleWatered"
        @show-logs="showLogs"
      />
    </div>

    <div v-if="showLogsModal" class="modal-overlay" @click.self="closeLogs">
      <div class="modal">
        <div class="modal-header">
          <h3>📋 浇水记录</h3>
          <button class="close-btn" @click="closeLogs">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="logsLoading" class="loading">加载中...</div>
          <div v-else-if="logs.length === 0" class="empty">暂无浇水记录</div>
          <div v-else class="logs-list">
            <div v-for="log in logs" :key="log.id" class="log-item">
              <div class="log-user">{{ log.wateredBy }}</div>
              <div class="log-time">{{ formatTime(log.wateredAt) }}</div>
              <div v-if="log.notes" class="log-notes">{{ log.notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { plantApi } from '../api/plant'
import PlantCard from '../components/PlantCard.vue'
import { usePlantWebSocket } from '../composables/usePlantWebSocket'

export default {
  name: 'OverdueList',
  components: { PlantCard },
  setup() {
    const overduePlants = ref([])
    const loading = ref(false)
    const notification = ref(null)
    
    const showLogsModal = ref(false)
    const logs = ref([])
    const logsLoading = ref(false)
    
    const { connect, disconnect, addMessageListener } = usePlantWebSocket()
    let removeListener = null

    const fetchOverduePlants = async () => {
      try {
        loading.value = true
        const response = await plantApi.getOverduePlants()
        overduePlants.value = response.data
        console.log('[OverdueList] 已加载', overduePlants.value.length, '盆逾期绿植')
      } catch (error) {
        console.error('[OverdueList] 加载逾期绿植失败:', error)
        showNotification('加载失败，请稍后重试', 'error')
      } finally {
        loading.value = false
      }
    }

    const initWebSocket = () => {
      removeListener = addMessageListener((updatedPlant) => {
        console.log('[OverdueList] 收到实时更新，刷新逾期列表:', updatedPlant.name)
        fetchOverduePlants()
      })
      connect()
    }

    const handleWatered = async ({ plantId, wateredBy }) => {
      try {
        const response = await plantApi.waterPlant(plantId, wateredBy)
        if (response.data.success) {
          showNotification(response.data.message, 'success')
          await fetchOverduePlants()
        }
      } catch (error) {
        console.error('浇水失败:', error)
        showNotification('操作失败，请稍后重试', 'error')
      }
    }

    const showLogs = async (plantId) => {
      showLogsModal.value = true
      logsLoading.value = true
      try {
        const response = await plantApi.getWateringLogs(plantId)
        logs.value = response.data
      } catch (error) {
        console.error('加载记录失败:', error)
      } finally {
        logsLoading.value = false
      }
    }

    const closeLogs = () => {
      showLogsModal.value = false
      logs.value = []
    }

    const formatTime = (time) => {
      if (!time) return ''
      const d = new Date(time)
      return d.toLocaleString('zh-CN')
    }

    const showNotification = (message, type = 'success') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 3000)
    }

    onMounted(() => {
      fetchOverduePlants()
      initWebSocket()
    })

    onUnmounted(() => {
      if (removeListener) {
        removeListener()
      }
      disconnect()
    })

    return {
      overduePlants,
      loading,
      notification,
      showLogsModal,
      logs,
      logsLoading,
      handleWatered,
      showLogs,
      closeLogs,
      formatTime
    }
  }
}
</script>

<style scoped>
.overdue-list-page {
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h2 {
  color: white;
  font-size: 1.8rem;
}

.alert-badge {
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 3rem;
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.plant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.empty {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.log-user {
  font-weight: bold;
  color: #333;
}

.log-time {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.3rem;
}

.log-notes {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.3rem;
  font-style: italic;
}

.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #10b981;
}

.notification.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
