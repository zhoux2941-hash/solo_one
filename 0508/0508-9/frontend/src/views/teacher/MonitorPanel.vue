<template>
  <div class="page-container">
    <div class="card">
      <div class="flex justify-between items-center mb-24">
        <h2 class="card-title" style="margin: 0;">考试监控</h2>
        <div class="flex gap-12 items-center">
          <select v-model="selectedExamId" class="form-input" style="width: 300px;" @change="onExamChange">
            <option value="">请选择要监控的考试</option>
            <option v-for="exam in exams" :key="exam.id" :value="exam.id">
              {{ exam.title }} ({{ getStatusText(exam.status) }})
            </option>
          </select>
          <span v-if="isConnected" class="status-badge status-active">
            🟢 已连接
          </span>
          <span v-else class="status-badge status-draft">
            🔴 未连接
          </span>
        </div>
      </div>
      
      <div v-if="!selectedExamId" class="empty-state">
        <div class="empty-icon">👁️</div>
        <div class="empty-text">请选择一个考试开始监控</div>
      </div>
      
      <div v-else>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">{{ statistics.totalEvents || 0 }}</div>
            <div class="stat-label">总异常事件</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ statistics.affectedUsers || 0 }}</div>
            <div class="stat-label">涉及学生数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ realtimeLogs.length }}</div>
            <div class="stat-label">实时日志数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ Object.keys(statistics.typeBreakdown || {}).length }}
            </div>
            <div class="stat-label">异常类型数</div>
          </div>
        </div>
        
        <div class="chart-grid">
          <div class="chart-card">
            <h3 class="chart-title">作弊趋势（实时）</h3>
            <TrendChart :data="trendData" />
          </div>
          <div class="chart-card">
            <h3 class="chart-title">高风险学生</h3>
            <RankingChart :students="highRiskStudents" />
          </div>
        </div>
        
        <div class="card">
          <h3 class="card-title">实时异常日志</h3>
          <div class="log-list">
            <div v-if="realtimeLogs.length === 0" class="empty-state" style="padding: 40px;">
              <div class="empty-text">暂无异常日志</div>
            </div>
            <div 
              v-for="log in realtimeLogs.slice(0, 50)" 
              :key="log.id" 
              class="log-item"
            >
              <div class="log-info">
                <span class="log-user">{{ log.userName }}</span>
                <span class="log-action">{{ getActionLabel(log.actionType) }}</span>
                <span v-if="log.questionNumber" class="status-badge status-draft">
                  {{ log.questionNumber }}
                </span>
              </div>
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from '@/utils/axios'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import TrendChart from '@/components/TrendChart.vue'
import RankingChart from '@/components/RankingChart.vue'

const exams = ref([])
const selectedExamId = ref('')
const isConnected = ref(false)
const isSubscribed = ref(false)
const connectionError = ref(null)
const statistics = ref({})
const realtimeLogs = ref([])
const trendData = ref([])
const highRiskStudents = ref([])

let stompClient = null
let refreshInterval = null
let subscription = null

const actionLabels = {
  'VISIBILITY_CHANGE': '切出窗口',
  'MOUSE_LEAVE': '鼠标离开',
  'COPY': '复制操作',
  'PASTE': '粘贴操作',
  'RIGHT_CLICK': '右键菜单',
  'KEYBOARD_SHORTCUT': '快捷键'
}

function getStatusText(status) {
  const statusMap = {
    'DRAFT': '草稿',
    'ACTIVE': '进行中',
    'COMPLETED': '已完成'
  }
  return statusMap[status] || status
}

function getActionLabel(type) {
  return actionLabels[type] || type
}

function formatTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function loadExams() {
  try {
    const response = await axios.get('/exam/list')
    if (response.code === 200) {
      exams.value = response.data
    }
  } catch (error) {
    console.error('Failed to load exams:', error)
  }
}

async function loadStatistics() {
  if (!selectedExamId.value) return
  
  try {
    const response = await axios.get(`/cheat/statistics/${selectedExamId.value}`)
    if (response.code === 200) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

async function loadTrendData() {
  if (!selectedExamId.value) return
  
  try {
    const response = await axios.get(`/cheat/trend/${selectedExamId.value}`)
    if (response.code === 200) {
      trendData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load trend data:', error)
  }
}

async function loadHighRiskStudents() {
  if (!selectedExamId.value) return
  
  try {
    const response = await axios.get(`/cheat/risk/${selectedExamId.value}`)
    if (response.code === 200) {
      highRiskStudents.value = response.data
    }
  } catch (error) {
    console.error('Failed to load high risk students:', error)
  }
}

async function loadRealtimeLogs() {
  if (!selectedExamId.value) return
  
  try {
    const response = await axios.get(`/cheat/realtime/${selectedExamId.value}`)
    if (response.code === 200) {
      realtimeLogs.value = response.data
    }
  } catch (error) {
    console.error('Failed to load realtime logs:', error)
  }
}

function connectWebSocket() {
  if (stompClient) {
    disconnectWebSocket()
  }
  
  if (!selectedExamId.value) return
  
  const wsUrl = `${window.location.protocol}//${window.location.host}/ws/cheat`
  
  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => {
      console.log('[STOMP Monitor]', str)
    },
    onConnect: () => {
      console.log('[STOMP Monitor] Connected')
      isConnected.value = true
      connectionError.value = null
      
      subscribeToExam()
    },
    onStompError: (frame) => {
      console.error('[STOMP Monitor] STOMP error:', frame)
      connectionError.value = 'STOMP协议错误'
    },
    onWebSocketError: (error) => {
      console.error('[STOMP Monitor] WebSocket error:', error)
      isConnected.value = false
    },
    onWebSocketClose: () => {
      console.log('[STOMP Monitor] WebSocket closed')
      isConnected.value = false
      isSubscribed.value = false
    }
  })
  
  stompClient.activate()
}

function subscribeToExam() {
  if (!stompClient || !stompClient.connected) {
    return
  }
  
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
  
  const destination = `/topic/exam/${selectedExamId.value}`
  
  subscription = stompClient.subscribe(destination, (message) => {
    try {
      const data = JSON.parse(message.body)
      
      if (data.type === 'error') {
        console.error('[STOMP Monitor] Subscription error:', data.message)
        connectionError.value = data.message
        isSubscribed.value = false
        return
      }
      
      if (data.type === 'subscribe_success') {
        console.log('[STOMP Monitor] Subscribed successfully:', data)
        isSubscribed.value = true
        return
      }
      
      if (data.type === 'cheat') {
        const log = data.data
        log.userName = data.userName || log.userName
        
        realtimeLogs.value.unshift(log)
        
        if (realtimeLogs.value.length > 100) {
          realtimeLogs.value.pop()
        }
        
        loadStatistics()
        loadHighRiskStudents()
        loadTrendData()
      }
    } catch (error) {
      console.error('[STOMP Monitor] Failed to parse message:', error)
    }
  })
}

function disconnectWebSocket() {
  if (subscription) {
    try {
      subscription.unsubscribe()
    } catch (e) {
      console.log('Error unsubscribing:', e)
    }
    subscription = null
  }
  
  if (stompClient) {
    try {
      stompClient.deactivate()
    } catch (e) {
      console.log('Error deactivating client:', e)
    }
    stompClient = null
  }
  
  isConnected.value = false
  isSubscribed.value = false
}

function onExamChange() {
  realtimeLogs.value = []
  statistics.value = {}
  trendData.value = []
  highRiskStudents.value = []
  connectionError.value = null
  
  if (selectedExamId.value) {
    loadStatistics()
    loadTrendData()
    loadHighRiskStudents()
    loadRealtimeLogs()
    connectWebSocket()
    
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    
    refreshInterval = setInterval(() => {
      loadTrendData()
      loadHighRiskStudents()
    }, 5000)
  } else {
    disconnectWebSocket()
    
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
}

onMounted(() => {
  loadExams()
})

onUnmounted(() => {
  disconnectWebSocket()
  
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
