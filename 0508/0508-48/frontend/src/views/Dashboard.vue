<template>
  <div class="dashboard">
    <div class="stats-card">
      <div class="stats-grid">
        <div class="stat-item total">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">器材总数</div>
        </div>
        <div class="stat-item sanitized">
          <div class="stat-number">{{ stats.sanitized }}</div>
          <div class="stat-label">已消毒</div>
        </div>
        <div class="stat-item unsanitized">
          <div class="stat-number">{{ stats.unsanitized }}</div>
          <div class="stat-label">未消毒</div>
        </div>
        <div class="stat-item total" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
          <div class="stat-number">{{ overdueCount }}</div>
          <div class="stat-label">超期未消毒</div>
        </div>
      </div>
    </div>

    <div class="batch-actions">
      <button 
        class="batch-btn primary" 
        @click="handleQuickSanitize"
        :disabled="submitting || overdueAlerts.length === 0"
      >
        ⚡ 一键快速消毒 ({{ overdueAlerts.length }})
      </button>
      <button 
        class="batch-btn secondary" 
        @click="showAlertModal = true"
        :disabled="overdueAlerts.length === 0"
      >
        📋 查看超期列表
      </button>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        🔄 刷新数据
      </button>
      <div class="ws-status" :class="wsConnected ? 'connected' : 'disconnected'">
        <span class="ws-dot" :class="wsConnected ? 'connected' : 'disconnected'"></span>
        <span>{{ wsConnected ? '实时连接' : '未连接' }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else class="equipment-grid">
      <div
        v-for="item in equipmentList"
        :key="item.equipment.id"
        :class="['equipment-card', item.sanitized ? 'sanitized' : 'unsanitized', isOverdue(item) ? 'overdue' : '']"
      >
        <div class="equipment-header">
          <div class="equipment-name">{{ item.equipment.name }}</div>
          <span class="equipment-category">{{ item.equipment.category }}</span>
        </div>

        <div :class="['status-badge', item.sanitized ? 'sanitized' : 'unsanitized']">
          <span v-if="isOverdue(item)">⏰ 超期 {{ getOverdueHours(item) }} 小时</span>
          <span v-else-if="item.sanitized">✅ 今日已消毒</span>
          <span v-else>⚠️ 今日未消毒</span>
        </div>

        <div class="equipment-info">
          <p>{{ item.equipment.description }}</p>
          <p style="color: #667eea; font-weight: 500;">
            ⏱️ 消毒标准: 每 {{ item.equipment.sanitizationIntervalHours || 2 }} 小时
          </p>
          <p v-if="item.sanitized && item.lastSanitizationTime">
            消毒时间: {{ formatTime(item.lastSanitizationTime) }}
          </p>
          <p v-if="item.sanitized && item.lastInspectorName">
            巡检员: {{ item.lastInspectorName }}
          </p>
        </div>

        <div v-if="item.lastPhotoBase64" class="photo-thumbnail">
          <img :src="item.lastPhotoBase64" alt="消毒照片" />
        </div>

        <button
          class="action-btn sanitize"
          @click="openSanitizeModal(item)"
        >
          📸 标记已消毒
        </button>
      </div>
    </div>

    <div class="pie-chart-section">
      <div class="chart-container">
        <div class="chart-header">
          <h3 class="chart-title">📊 消毒合格率统计</h3>
          <div class="chart-controls">
            <button 
              v-for="period in periods" 
              :key="period.value"
              class="period-btn" 
              :class="{ active: selectedPeriod === period.value }"
              @click="changePeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
        </div>

        <div class="pie-chart-wrapper">
          <div class="pie-chart">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#e0e0e0"
                :stroke-dasharray="`${overduePercent} 100`"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#38ef7d"
                :stroke-dasharray="`${onTimePercent} 100`"
                :stroke-dashoffset="`${-overduePercent}`"
              />
            </svg>
            <div class="chart-center">
              <div class="percentage">{{ complianceStats.complianceRate || 0 }}%</div>
              <div class="label">合格率</div>
            </div>
          </div>

          <div class="chart-legend">
            <div class="legend-item-large">
              <div class="legend-color" style="background: #38ef7d;"></div>
              <div class="legend-info">
                <span class="legend-label">按时消毒</span>
                <span class="legend-value">{{ complianceStats.onTimeCount || 0 }} 个器材</span>
              </div>
            </div>
            <div class="legend-item-large">
              <div class="legend-color" style="background: #e0e0e0;"></div>
              <div class="legend-info">
                <span class="legend-label">超期未消毒</span>
                <span class="legend-value">{{ complianceStats.overdueCount || 0 }} 个器材</span>
              </div>
            </div>
            <div class="legend-item-large">
              <div class="legend-color" style="background: #667eea;"></div>
              <div class="legend-info">
                <span class="legend-label">总计</span>
                <span class="legend-value">{{ complianceStats.totalCount || 0 }} 个器材</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>消毒记录 - {{ selectedEquipment?.equipment?.name }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="form-group">
          <label>巡检员姓名</label>
          <input
            type="text"
            v-model="inspectorName"
            placeholder="请输入巡检员姓名"
          />
        </div>

        <div class="camera-container">
          <video
            v-if="cameraActive && !photoCaptured"
            ref="videoRef"
            autoplay
            playsinline
          ></video>
          <canvas
            v-if="photoCaptured"
            ref="canvasRef"
            width="640"
            height="480"
          ></canvas>
          <div v-if="!cameraActive && !photoCaptured" class="camera-placeholder">
            <p>📷 点击下方按钮启动摄像头</p>
          </div>

          <div class="camera-controls">
            <button
              v-if="!cameraActive && !photoCaptured"
              class="camera-btn primary"
              @click="startCamera"
            >
              🎥 启动摄像头
            </button>
            <button
              v-if="cameraActive && !photoCaptured"
              class="camera-btn primary"
              @click="capturePhoto"
            >
              📸 拍照
            </button>
            <button
              v-if="photoCaptured"
              class="camera-btn secondary"
              @click="retakePhoto"
            >
              🔄 重拍
            </button>
            <button
              v-if="!cameraActive && !photoCaptured"
              class="camera-btn secondary"
              @click="useMockPhoto"
            >
              🖼️ 使用模拟照片
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">
            取消
          </button>
          <button
            class="btn btn-primary"
            @click="submitSanitization"
            :disabled="submitting || !inspectorName"
          >
            {{ submitting ? '提交中...' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAlertModal" class="modal-overlay" @click.self="showAlertModal = false">
      <div class="modal alert-modal">
        <div class="modal-header">
          <h2>⚠️ 超期消毒提醒 ({{ overdueAlerts.length }})</h2>
          <button class="close-btn" @click="showAlertModal = false">&times;</button>
        </div>

        <div v-if="overdueAlerts.length === 0" style="text-align: center; padding: 30px; color: #666;">
          🎉 所有器材都按时消毒了！
        </div>

        <div v-else class="alert-list">
          <div 
            v-for="alert in overdueAlerts" 
            :key="alert.equipmentId"
            :class="['alert-item', alert.status === 'NEVER_SANITIZED' ? 'never-sanitized' : '']"
          >
            <div class="alert-item-header">
              <span class="alert-item-name">{{ alert.equipmentName }}</span>
              <span class="alert-item-category">{{ alert.equipmentCategory }}</span>
            </div>
            <p class="alert-item-info">
              标准: 每 {{ alert.sanitizationIntervalHours }} 小时消毒
            </p>
            <p v-if="alert.status === 'NEVER_SANITIZED'" class="alert-item-info overdue">
              ⚠️ 从未消毒过！
            </p>
            <p v-else>
              上次: {{ formatTime(alert.lastSanitizationTime) }}
            </p>
            <p v-if="alert.status === 'OVERDUE'" class="alert-item-info overdue">
              ⏰ 已超期 {{ alert.overdueHours }} 小时
            </p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAlertModal = false">
            关闭
          </button>
          <button 
            class="btn btn-primary" 
            @click="handleQuickSanitizeFromAlert"
            :disabled="submitting"
          >
            {{ submitting ? '提交中...' : '一键快速消毒' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>⚠️ 确认批量消毒</h2>
          <button class="close-btn" @click="showConfirmModal = false">&times;</button>
        </div>

        <div style="margin: 20px 0;">
          <p style="font-size: 1.1rem; margin-bottom: 15px;">
            您即将对 <strong style="color: #eb3349;">{{ pendingBatchEquipmentIds.length }}</strong> 个器材执行快速消毒：
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; max-height: 200px; overflow-y: auto;">
            <div v-for="id in pendingBatchEquipmentIds" :key="id" style="margin: 5px 0;">
              • {{ getEquipmentNameById(id) }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>巡检员姓名</label>
          <input
            type="text"
            v-model="batchInspectorName"
            placeholder="请输入巡检员姓名"
          />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showConfirmModal = false">
            取消
          </button>
          <button 
            class="btn btn-primary" 
            @click="executeBatchSanitization"
            :disabled="!batchInspectorName || submitting"
          >
            {{ submitting ? '提交中...' : '确认消毒' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { sanitizationApi } from '../api'
import { wsService } from '../utils/websocket'

const loading = ref(false)
const equipmentList = ref([])
const showModal = ref(false)
const selectedEquipment = ref(null)
const inspectorName = ref('')
const cameraActive = ref(false)
const photoCaptured = ref(false)
const photoBase64 = ref('')
const submitting = ref(false)

const showAlertModal = ref(false)
const showConfirmModal = ref(false)
const overdueAlerts = ref([])
const pendingBatchEquipmentIds = ref([])
const batchInspectorName = ref('')

const wsConnected = ref(false)
const selectedPeriod = ref('LAST_7_DAYS')
const complianceStats = ref({})

const videoRef = ref(null)
const canvasRef = ref(null)
let mediaStream = null

const periods = [
  { label: '今日', value: 'TODAY' },
  { label: '近7天', value: 'LAST_7_DAYS' },
  { label: '近30天', value: 'LAST_30_DAYS' }
]

const stats = computed(() => ({
  total: equipmentList.value.length,
  sanitized: equipmentList.value.filter(item => item.sanitized).length,
  unsanitized: equipmentList.value.filter(item => !item.sanitized).length
}))

const overdueCount = computed(() => overdueAlerts.value.length)

const onTimePercent = computed(() => {
  const total = (complianceStats.value.onTimeCount || 0) + (complianceStats.value.overdueCount || 0)
  if (total === 0) return 0
  return (complianceStats.value.onTimeCount || 0) / total * 100
})

const overduePercent = computed(() => {
  const total = (complianceStats.value.onTimeCount || 0) + (complianceStats.value.overdueCount || 0)
  if (total === 0) return 0
  return (complianceStats.value.overdueCount || 0) / total * 100
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

const isOverdue = (item) => {
  if (!item.lastSanitizationTime) return true
  const intervalHours = item.equipment.sanitizationIntervalHours || 2
  const lastTime = new Date(item.lastSanitizationTime)
  const now = new Date()
  const hoursSince = (now - lastTime) / (1000 * 60 * 60)
  return hoursSince > intervalHours
}

const getOverdueHours = (item) => {
  if (!item.lastSanitizationTime) return 'N/A'
  const intervalHours = item.equipment.sanitizationIntervalHours || 2
  const lastTime = new Date(item.lastSanitizationTime)
  const now = new Date()
  const hoursSince = (now - lastTime) / (1000 * 60 * 60)
  return Math.floor(hoursSince - intervalHours)
}

const getEquipmentNameById = (id) => {
  const item = equipmentList.value.find(e => e.equipment.id === id)
  return item ? item.equipment.name : `器材 #${id}`
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await sanitizationApi.getTodayStatus()
    if (response.data.success) {
      equipmentList.value = response.data.data
      updateOverdueAlerts()
    }
    await loadComplianceStats()
  } catch (error) {
    console.error('Failed to load data:', error)
    alert('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadComplianceStats = async () => {
  try {
    const response = await sanitizationApi.getComplianceStats(selectedPeriod.value)
    if (response.data.success) {
      complianceStats.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load compliance stats:', error)
  }
}

const changePeriod = (period) => {
  selectedPeriod.value = period
  loadComplianceStats()
}

const updateOverdueAlerts = () => {
  const alerts = []
  equipmentList.value.forEach(item => {
    if (isOverdue(item)) {
      alerts.push({
        equipmentId: item.equipment.id,
        equipmentName: item.equipment.name,
        equipmentCategory: item.equipment.category,
        sanitizationIntervalHours: item.equipment.sanitizationIntervalHours || 2,
        lastSanitizationTime: item.lastSanitizationTime,
        overdueHours: item.lastSanitizationTime ? getOverdueHours(item) : -1,
        status: item.lastSanitizationTime ? 'OVERDUE' : 'NEVER_SANITIZED'
      })
    }
  })
  overdueAlerts.value = alerts
}

const connectWebSocket = async () => {
  try {
    await wsService.connect()
    wsConnected.value = true
    console.log('WebSocket connected successfully')
    
    wsService.subscribe('/topic/alerts', (message) => {
      console.log('Received alert:', message)
      if (message.alerts && message.alerts.length > 0) {
        overdueAlerts.value = message.alerts
        if (message.alerts.length > 0) {
          showAlertModal.value = true
        }
        loadData()
      }
    })
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
    wsConnected.value = false
  }
}

const openSanitizeModal = (item) => {
  selectedEquipment.value = item
  inspectorName.value = localStorage.getItem('inspectorName') || ''
  photoBase64.value = ''
  photoCaptured.value = false
  showModal.value = true
}

const closeModal = () => {
  stopCamera()
  showModal.value = false
  selectedEquipment.value = null
  photoBase64.value = ''
  photoCaptured.value = false
}

const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false
    })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      cameraActive.value = true
    }
  } catch (error) {
    console.error('Failed to start camera:', error)
    alert('无法启动摄像头，请检查权限设置。您可以使用"使用模拟照片"功能。')
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  cameraActive.value = false
}

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return

  const canvas = canvasRef.value
  const video = videoRef.value
  
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  photoBase64.value = canvas.toDataURL('image/jpeg', 0.7)
  photoCaptured.value = true
  stopCamera()
}

const retakePhoto = () => {
  photoBase64.value = ''
  photoCaptured.value = false
  startCamera()
}

const useMockPhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createLinearGradient(0, 0, 640, 480)
  gradient.addColorStop(0, '#11998e')
  gradient.addColorStop(1, '#38ef7d')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 640, 480)
  
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('✓ 已消毒', 320, 220)
  ctx.font = '20px Arial'
  ctx.fillText(selectedEquipment.value?.equipment?.name || '', 320, 260)
  ctx.font = '16px Arial'
  ctx.fillText(new Date().toLocaleString('zh-CN'), 320, 300)
  
  photoBase64.value = canvas.toDataURL('image/jpeg', 0.7)
  photoCaptured.value = true
  
  if (canvasRef.value) {
    const displayCanvas = canvasRef.value
    const displayCtx = displayCanvas.getContext('2d')
    displayCtx.drawImage(canvas, 0, 0)
  }
}

const submitSanitization = async () => {
  if (!inspectorName.value) {
    alert('请输入巡检员姓名')
    return
  }

  submitting.value = true
  try {
    const response = await sanitizationApi.record({
      equipmentId: selectedEquipment.value.equipment.id,
      inspectorName: inspectorName.value,
      photoBase64: photoBase64.value || null
    })

    if (response.data.success) {
      localStorage.setItem('inspectorName', inspectorName.value)
      alert('消毒记录提交成功！')
      closeModal()
      await loadData()
    } else {
      alert(response.data.message || '提交失败')
    }
  } catch (error) {
    console.error('Submit error:', error)
    alert('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleQuickSanitize = () => {
  if (overdueAlerts.value.length === 0) {
    alert('没有超期需要消毒的器材')
    return
  }
  pendingBatchEquipmentIds.value = overdueAlerts.value.map(a => a.equipmentId)
  batchInspectorName.value = localStorage.getItem('inspectorName') || ''
  showConfirmModal.value = true
}

const handleQuickSanitizeFromAlert = () => {
  showAlertModal.value = false
  handleQuickSanitize()
}

const executeBatchSanitization = async () => {
  if (!batchInspectorName.value) {
    alert('请输入巡检员姓名')
    return
  }
  if (pendingBatchEquipmentIds.value.length === 0) {
    alert('没有选择要消毒的器材')
    return
  }

  const confirmed = confirm(`确认要对 ${pendingBatchEquipmentIds.value.length} 个器材执行快速消毒吗？`)
  if (!confirmed) return

  submitting.value = true
  try {
    const response = await sanitizationApi.batchRecord({
      equipmentIds: pendingBatchEquipmentIds.value,
      inspectorName: batchInspectorName.value,
      photoBase64: null
    })

    if (response.data.success) {
      localStorage.setItem('inspectorName', batchInspectorName.value)
      alert(`批量消毒成功！已消毒 ${response.data.count} 个器材`)
      showConfirmModal.value = false
      pendingBatchEquipmentIds.value = []
      await loadData()
    } else {
      alert(response.data.message || '批量消毒失败')
    }
  } catch (error) {
    console.error('Batch sanitization error:', error)
    alert('批量消毒失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  connectWebSocket()
})

onUnmounted(() => {
  stopCamera()
  wsService.disconnect()
})
</script>
