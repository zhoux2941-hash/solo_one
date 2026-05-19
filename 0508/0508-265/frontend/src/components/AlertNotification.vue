<template>
  <div class="alert-notification">
    <el-drawer
      v-model="visible"
      title="实时告警"
      direction="rtl"
      size="400px"
    >
      <div class="alert-list">
        <div v-for="alert in alerts" :key="alert.id" class="alert-item">
          <el-tag :type="getAlertType(alert.level)" size="small" class="alert-tag">
            {{ alert.level }}
          </el-tag>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-device">{{ alert.deviceName || alert.deviceCode }}</div>
            <div class="alert-time">{{ formatTime(alert.alertTime) }}</div>
          </div>
        </div>
        <div v-if="alerts.length === 0" class="empty">
          <el-empty description="暂无告警信息" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { alertApi } from '../api'

const visible = ref(false)
const alerts = ref([])

const getAlertType = (level) => {
  const map = {
    'INFO': 'info',
    'WARNING': 'warning',
    'ERROR': 'danger'
  }
  return map[level] || 'info'
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadAlerts = async () => {
  alerts.value = await alertApi.getLatest()
}

let interval = null

onMounted(() => {
  loadAlerts()
  interval = setInterval(loadAlerts, 30000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>

<style scoped>
.alert-list {
  padding: 0;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.alert-item:hover {
  background-color: #f9f9f9;
}

.alert-tag {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.alert-device {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #999;
}

.empty {
  padding: 40px 0;
}
</style>
