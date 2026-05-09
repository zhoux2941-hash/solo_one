<template>
  <div class="checkin-records">
    <div class="header">
      <h2 class="title">我的打卡记录</h2>
      <button class="refresh-btn" @click="loadRecords" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="stats-summary" v-if="records.length > 0">
      <div class="stat-item">
        <div class="stat-value">{{ totalDays }}</div>
        <div class="stat-label">总打卡天数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value success">{{ successDays }}</div>
        <div class="stat-label">成功天数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value points">{{ totalPoints }}</div>
        <div class="stat-label">获得积分</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ successRate }}%</div>
        <div class="stat-label">成功率</div>
      </div>
    </div>

    <div class="records-list" v-if="records.length > 0">
      <div 
        class="record-item" 
        v-for="record in records" 
        :key="record.checkinDate"
        :class="{ success: record.isSuccess, fail: !record.isSuccess }"
      >
        <div class="record-left">
          <div class="date">{{ formatDate(record.checkinDate) }}</div>
          <div class="probability">
            光盘概率: {{ (record.plateProbability * 100).toFixed(1) }}%
          </div>
        </div>
        
        <div class="record-right">
          <div class="status" :class="{ success: record.isSuccess }">
            <span v-if="record.isSuccess">成功</span>
            <span v-else>失败</span>
          </div>
          <div class="points" v-if="record.isSuccess">
            +{{ record.pointsEarned }} 分
          </div>
          <div class="consecutive" v-if="record.isSuccess && record.consecutiveDays > 1">
            连续 {{ record.consecutiveDays }} 天
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无打卡记录</div>
      <div class="empty-desc">快去完成第一次光盘行动打卡吧！</div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import checkinService from '../api/checkinService.js'

const props = defineProps({
  employeeNo: {
    type: String,
    required: true
  },
  refreshTrigger: {
    type: Number,
    default: 0
  }
})

const records = ref([])
const loading = ref(false)
const errorMessage = ref(null)

const totalDays = computed(() => records.value.length)
const successDays = computed(() => records.value.filter(r => r.isSuccess).length)
const totalPoints = computed(() => records.value.reduce((sum, r) => sum + (r.pointsEarned || 0), 0))
const successRate = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.round((successDays.value / totalDays.value) * 100)
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${year}-${month}-${day} ${weekday}`
}

const loadRecords = async () => {
  loading.value = true
  errorMessage.value = null

  try {
    const result = await checkinService.getCheckinRecords(props.employeeNo)
    if (result.code === 200) {
      records.value = result.data || []
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '获取打卡记录失败'
    console.error('获取打卡记录失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecords()
})

import { watch } from 'vue'
watch(() => props.refreshTrigger, () => {
  loadRecords()
})

defineExpose({
  refresh: loadRecords
})
</script>

<style scoped>
.checkin-records {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  color: #333;
  font-size: 20px;
  margin: 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1976D2;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-value.success {
  color: #81C784;
}

.stat-value.points {
  color: #FFD54F;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.records-list {
  max-height: 500px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid #ccc;
  background: #f9f9f9;
  transition: transform 0.2s;
}

.record-item:hover {
  transform: translateX(4px);
}

.record-item.success {
  border-left-color: #4CAF50;
  background: #e8f5e9;
}

.record-item.fail {
  border-left-color: #f44336;
  background: #ffebee;
}

.record-left {
  flex: 1;
}

.date {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
}

.probability {
  font-size: 12px;
  color: #666;
}

.record-right {
  text-align: right;
}

.status {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #f44336;
}

.status.success {
  color: #4CAF50;
}

.points {
  font-weight: 700;
  font-size: 16px;
  color: #4CAF50;
  margin-bottom: 2px;
}

.consecutive {
  font-size: 12px;
  color: #FF9800;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #999;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  text-align: center;
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>
