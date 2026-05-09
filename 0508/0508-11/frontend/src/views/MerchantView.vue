<template>
  <div class="merchant-view">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>当前排队</h3>
        <div class="value">{{ overview.activeQueues || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>已完成订单</h3>
        <div class="value">{{ overview.totalCompleted || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>总桌位数</h3>
        <div class="value">{{ overview.totalTables || 0 }}</div>
      </div>
    </div>

    <div class="current-call" v-if="currentCalled">
      <h2>🎙️ 当前叫号</h2>
      <div class="number">{{ currentCalled.queueNumber }}</div>
      <p style="margin-top: 10px; opacity: 0.9;">
        {{ currentCalled.partySize }} 人 | 叫号时间: {{ formatTime(currentCalled.callTime) }}
      </p>
      <div class="action-buttons" style="margin-top: 20px; justify-content: center;">
        <button class="btn btn-success" @click="completeQueue(currentCalled.queueId)">
          ✅ 完成就餐
        </button>
        <button class="btn btn-danger" @click="skipQueue(currentCalled.queueId)">
          ⏭️ 过号
        </button>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>🏪 排队管理</h2>
        <button 
          class="btn btn-primary" 
          @click="callNext"
          :disabled="!hasWaiting || calling"
        >
          {{ calling ? '叫号中...' : '🎤 叫下一位' }}
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>排队号</th>
              <th>手机</th>
              <th>人数</th>
              <th>状态</th>
              <th>排队时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in activeQueues" :key="item.queueId">
              <td>{{ index + 1 }}</td>
              <td><strong>{{ item.queueNumber }}</strong></td>
              <td>{{ maskPhone(item.phoneNumber) }}</td>
              <td>{{ item.partySize }} 人</td>
              <td>
                <span :class="['badge', getStatusClass(item.status)]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>{{ formatTime(item.enqueueTime) }}</td>
              <td>
                <div v-if="item.status === 'WAITING'" class="action-buttons">
                  <button class="btn btn-success" @click="completeQueue(item.queueId)" size="small">
                    直接完成
                  </button>
                  <button class="btn btn-danger" @click="skipQueue(item.queueId)" size="small">
                    过号
                  </button>
                </div>
                <div v-else-if="item.status === 'CALLED'" class="action-buttons">
                  <button class="btn btn-success" @click="completeQueue(item.queueId)" size="small">
                    完成
                  </button>
                  <button class="btn btn-danger" @click="skipQueue(item.queueId)" size="small">
                    过号
                  </button>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="activeQueues.length === 0">
              <td colspan="7" class="empty-state">
                <h3>暂无排队</h3>
                <p>顾客取号后会显示在这里</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { queueApi, analyticsApi } from '../api'

const activeQueues = ref([])
const overview = ref({})
const calling = ref(false)
const completing = ref(false)
let refreshInterval = null

const currentCalled = computed(() => {
  return activeQueues.value.find(q => q.status === 'CALLED')
})

const hasWaiting = computed(() => {
  return activeQueues.value.some(q => q.status === 'WAITING')
})

const loadActiveQueues = async () => {
  try {
    const res = await queueApi.getActive()
    activeQueues.value = res.data
  } catch (e) {
    console.error('加载排队列表失败', e)
  }
}

const loadOverview = async () => {
  try {
    const res = await analyticsApi.getOverview()
    overview.value = res.data
  } catch (e) {
    console.error('加载概览失败', e)
  }
}

const callNext = async () => {
  if (calling.value) return
  calling.value = true
  try {
    await queueApi.callNext()
    await loadActiveQueues()
    await loadOverview()
  } catch (e) {
    alert(e.response?.data?.message || '叫号失败')
  } finally {
    calling.value = false
  }
}

const completeQueue = async (queueId) => {
  if (completing.value) return
  completing.value = true
  try {
    await queueApi.complete(queueId)
    await loadActiveQueues()
    await loadOverview()
  } catch (e) {
    alert(e.response?.data?.message || '操作失败')
  } finally {
    completing.value = false
  }
}

const skipQueue = async (queueId) => {
  if (confirm('确定要标记为过号吗？')) {
    try {
      await queueApi.skip(queueId)
      await loadActiveQueues()
    } catch (e) {
      alert(e.response?.data?.message || '操作失败')
    }
  }
}

const getStatusClass = (status) => {
  const map = {
    WAITING: 'badge-waiting',
    CALLED: 'badge-called',
    COMPLETED: 'badge-completed',
    SKIPPED: 'badge-skipped'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    WAITING: '等待中',
    CALLED: '已叫号',
    COMPLETED: '已完成',
    SKIPPED: '已过号'
  }
  return map[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  const d = new Date(time)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const maskPhone = (phone) => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

onMounted(() => {
  loadActiveQueues()
  loadOverview()
  
  refreshInterval = setInterval(() => {
    loadActiveQueues()
    loadOverview()
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.merchant-view {
}

.action-buttons button {
  padding: 8px 16px;
  font-size: 14px;
}

table {
  width: 100%;
}
</style>
