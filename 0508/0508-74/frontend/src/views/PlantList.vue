<template>
  <div class="plant-list-page">
    <div class="page-header">
      <h2>🌿 所有绿植</h2>
      <div class="stats">
        <span class="stat-item">
          <span class="stat-number">{{ plants.length }}</span>
          <span class="stat-label">总绿植数</span>
        </span>
        <span class="stat-item overdue">
          <span class="stat-number">{{ overdueCount }}</span>
          <span class="stat-label">逾期</span>
        </span>
        <span class="stat-item warning">
          <span class="stat-number">{{ warningCount }}</span>
          <span class="stat-label">即将到期</span>
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else class="plant-grid">
      <PlantCard
        v-for="plant in plants"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { plantApi } from '../api/plant'
import PlantCard from '../components/PlantCard.vue'
import { usePlantWebSocket } from '../composables/usePlantWebSocket'

export default {
  name: 'PlantList',
  components: { PlantCard },
  setup() {
    const plants = ref([])
    const loading = ref(false)
    const notification = ref(null)
    
    const showLogsModal = ref(false)
    const logs = ref([])
    const logsLoading = ref(false)
    const currentPlantId = ref(null)
    
    const { connect, disconnect, addMessageListener, connectionState } = usePlantWebSocket()
    let removeListener = null

    const overdueCount = computed(() => 
      plants.value.filter(p => p.isOverdue).length
    )

    const warningCount = computed(() => 
      plants.value.filter(p => !p.isOverdue && p.daysUntilNextWatering !== null && p.daysUntilNextWatering <= 1).length
    )

    const fetchPlants = async () => {
      try {
        loading.value = true
        const response = await plantApi.getAllPlants()
        plants.value = response.data
        console.log('[PlantList] 已加载', plants.value.length, '盆绿植')
      } catch (error) {
        console.error('[PlantList] 加载绿植失败:', error)
        showNotification('加载失败，请稍后重试', 'error')
      } finally {
        loading.value = false
      }
    }

    const initWebSocket = () => {
      removeListener = addMessageListener((updatedPlant) => {
        console.log('[PlantList] 收到实时更新:', updatedPlant.name)
        const index = plants.value.findIndex(p => p.id === updatedPlant.id)
        if (index !== -1) {
          plants.value[index] = updatedPlant
          showNotification(`${updatedPlant.name} 状态已更新`, 'success')
        }
      })
      connect()
    }

    const handleWatered = async ({ plantId, wateredBy }) => {
      try {
        const response = await plantApi.waterPlant(plantId, wateredBy)
        if (response.data.success) {
          showNotification(response.data.message, 'success')
          await fetchPlants()
        }
      } catch (error) {
        console.error('浇水失败:', error)
        showNotification('操作失败，请稍后重试', 'error')
      }
    }

    const showLogs = async (plantId) => {
      currentPlantId.value = plantId
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
      fetchPlants()
      initWebSocket()
    })

    onUnmounted(() => {
      if (removeListener) {
        removeListener()
      }
      disconnect()
    })

    return {
      plants,
      loading,
      notification,
      showLogsModal,
      logs,
      logsLoading,
      overdueCount,
      warningCount,
      handleWatered,
      showLogs,
      closeLogs,
      formatTime
    }
  }
}
</script>

<style scoped>
.plant-list-page {
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

.stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-item.overdue .stat-number {
  color: #ef4444;
}

.stat-item.warning .stat-number {
  color: #f59e0b;
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 3rem;
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
