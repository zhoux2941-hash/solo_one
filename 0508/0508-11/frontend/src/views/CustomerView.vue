<template>
  <div class="customer-view">
    <div class="card">
      <h2>📱 顾客取号</h2>
      
      <div v-if="!currentQueue" class="enqueue-form">
        <div class="form-group">
          <label>手机号码</label>
          <input 
            v-model="form.phoneNumber" 
            type="tel" 
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </div>
        
        <div class="form-group">
          <label>用餐人数</label>
          <select v-model="form.partySize">
            <option :value="1">1 人</option>
            <option :value="2">2 人</option>
            <option :value="3">3 人</option>
            <option :value="4">4 人</option>
            <option :value="5">5 人</option>
            <option :value="6">6 人</option>
            <option :value="7">7 人</option>
            <option :value="8">8 人</option>
          </select>
        </div>

        <div v-if="prediction" class="prediction-info">
          <p>
            <span>预估等待: </span>
            <strong>{{ prediction.estimatedWaitMinutes }} 分钟</strong>
          </p>
          <p class="prediction-detail">
            当前排队 {{ prediction.currentQueueLength }} 桌，
            可用 {{ prediction.availableTables }} 桌
          </p>
        </div>
        
        <button 
          class="btn btn-primary" 
          @click="handleEnqueue"
          :disabled="!form.phoneNumber || loading"
        >
          {{ loading ? '取号中...' : '取号排队' }}
        </button>
      </div>

      <div v-else class="queue-number-display">
        <h3>您的排队号</h3>
        <div class="queue-number">{{ currentQueue.queueNumber }}</div>
        
        <div v-if="currentQueue.status === 'WAITING'" class="waiting-info">
          <div class="position">
            前面还有 <strong>{{ currentQueue.position - 1 }}</strong> 桌
          </div>
          <div class="wait-time">
            预估等待 <strong>{{ currentQueue.estimatedWaitMinutes }}</strong> 分钟
          </div>
        </div>

        <div v-else-if="currentQueue.status === 'CALLED'" class="called-info">
          <div class="position">
            🎉 轮到您了！请前往前台用餐
          </div>
        </div>

        <div v-else-if="currentQueue.status === 'COMPLETED'" class="completed-info">
          <div class="position">
            ✅ 已完成就餐
          </div>
        </div>

        <div v-else-if="currentQueue.status === 'SKIPPED'" class="skipped-info">
          <div class="position">
            ⚠️ 已过号
          </div>
        </div>

        <button class="btn btn-warning" @click="refreshStatus" :disabled="refreshing">
          {{ refreshing ? '刷新中...' : '刷新状态' }}
        </button>
        <button class="btn btn-primary" @click="resetForm" style="margin-left: 10px;">
          重新取号
        </button>
      </div>
    </div>

    <div class="card">
      <h3>📋 当前等待列表</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>排队号</th>
              <th>人数</th>
              <th>状态</th>
              <th>排队时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in waitingList" :key="item.queueId">
              <td>
                <strong>{{ item.queueNumber }}</strong>
                <span v-if="item.position" class="position-badge">第{{ item.position }}位</span>
              </td>
              <td>{{ item.partySize }} 人</td>
              <td>
                <span :class="['badge', getStatusClass(item.status)]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td>{{ formatTime(item.enqueueTime) }}</td>
            </tr>
            <tr v-if="waitingList.length === 0">
              <td colspan="4" class="empty-state">
                暂无等待顾客
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { queueApi } from '../api'

const form = ref({
  phoneNumber: '',
  partySize: 2
})

const loading = ref(false)
const refreshing = ref(false)
const currentQueue = ref(null)
const prediction = ref(null)
const waitingList = ref([])
let refreshInterval = null

const getPrediction = async () => {
  try {
    const res = await queueApi.predictWait(form.value.partySize)
    prediction.value = res.data
  } catch (e) {
    console.error('获取等待时间预测失败', e)
  }
}

const handleEnqueue = async () => {
  if (!form.value.phoneNumber) return
  loading.value = true
  try {
    const res = await queueApi.enqueue(form.value)
    currentQueue.value = res.data
    localStorage.setItem('currentQueueId', res.data.queueId)
  } catch (e) {
    alert(e.response?.data?.message || '取号失败')
  } finally {
    loading.value = false
  }
}

const refreshStatus = async () => {
  if (!currentQueue.value) return
  refreshing.value = true
  try {
    const res = await queueApi.getStatus(currentQueue.value.queueId)
    currentQueue.value = res.data
  } catch (e) {
    console.error('刷新状态失败', e)
  } finally {
    refreshing.value = false
  }
}

const loadWaitingList = async () => {
  try {
    const res = await queueApi.getActive()
    waitingList.value = res.data
  } catch (e) {
    console.error('加载等待列表失败', e)
  }
}

const resetForm = () => {
  currentQueue.value = null
  localStorage.removeItem('currentQueueId')
  form.value.phoneNumber = ''
  form.value.partySize = 2
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
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

watch(() => form.value.partySize, () => {
  getPrediction()
})

onMounted(() => {
  getPrediction()
  loadWaitingList()
  
  const savedId = localStorage.getItem('currentQueueId')
  if (savedId) {
    queueApi.getStatus(savedId).then(res => {
      currentQueue.value = res.data
    }).catch(() => {
      localStorage.removeItem('currentQueueId')
    })
  }
  
  refreshInterval = setInterval(() => {
    loadWaitingList()
    if (currentQueue.value && currentQueue.value.status === 'WAITING') {
      refreshStatus()
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.customer-view h2 {
  margin-bottom: 20px;
  color: #333;
}

.enqueue-form {
  max-width: 400px;
}

.prediction-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.prediction-info p {
  margin: 5px 0;
  color: #666;
}

.prediction-info strong {
  color: #667eea;
  font-size: 18px;
}

.prediction-detail {
  font-size: 14px;
}

.waiting-info, .called-info, .completed-info, .skipped-info {
  margin-bottom: 20px;
}

.position-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

table {
  width: 100%;
}
</style>
