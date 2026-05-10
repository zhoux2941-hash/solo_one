<template>
  <div class="alert-container">
    <div v-if="alerts.length > 0" class="alert-header">
      <span class="alert-title">
        🚨 实时告警 ({{ alerts.length }})
      </span>
      <button class="clear-btn" @click="clearAlerts">清空</button>
    </div>
    
    <TransitionGroup name="alert-list" tag="div" class="alert-list">
      <div
        v-for="alert in sortedAlerts"
        :key="alert.id"
        class="alert-item"
        :class="['level-' + alert.level]"
      >
        <div class="alert-top">
          <div class="alert-tank">
            <span class="tank-icon">🐠</span>
            <span class="tank-name">{{ alert.tankName }}</span>
          </div>
          <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
        </div>
        
        <div class="alert-content">
          <div class="alert-ph">
            <span class="ph-label">当前pH:</span>
            <span class="ph-value" :class="getPhClass(alert)">{{ alert.currentPh }}</span>
          </div>
          <div class="alert-type">
            <span class="type-badge">{{ alert.alertType }}</span>
            <span class="range-info">正常范围: {{ alert.phMin }} ~ {{ alert.phMax }}</span>
          </div>
        </div>
        
        <div class="alert-suggestion">
          <span class="suggestion-icon">💡</span>
          <span class="suggestion-text">{{ alert.suggestion }}</span>
        </div>
        
        <button class="dismiss-btn" @click="dismissAlert(alert.id)">×</button>
      </div>
    </TransitionGroup>
    
    <div v-if="alerts.length === 0" class="no-alerts">
      <span class="check-icon">✅</span>
      <span>暂无告警，所有展缸运行正常</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AlertNotification',
  props: {
    alerts: {
      type: Array,
      required: true
    }
  },
  emits: ['dismiss', 'clear'],
  setup(props, { emit }) {
    const sortedAlerts = computed(() => {
      return [...props.alerts].sort((a, b) => {
        const levelOrder = { danger: 0, warning: 1 }
        const levelDiff = levelOrder[a.level] - levelOrder[b.level]
        if (levelDiff !== 0) return levelDiff
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    })

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const getPhClass = (alert) => {
      if (alert.currentPh < alert.phMin) return 'ph-low'
      if (alert.currentPh > alert.phMax) return 'ph-high'
      return ''
    }

    const dismissAlert = (id) => {
      emit('dismiss', id)
    }

    const clearAlerts = () => {
      emit('clear')
    }

    return {
      sortedAlerts,
      formatTime,
      getPhClass,
      dismissAlert,
      clearAlerts
    }
  }
}
</script>

<style scoped>
.alert-container {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  border: 1px solid #334155;
  padding: 16px;
  margin-bottom: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.alert-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.clear-btn {
  padding: 6px 12px;
  background: rgba(100, 116, 139, 0.3);
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-list-enter-active,
.alert-list-leave-active {
  transition: all 0.3s ease;
}

.alert-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.alert-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.alert-item {
  position: relative;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid;
  animation: alertPulse 2s ease-in-out infinite;
}

.alert-item.level-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.4);
  animation: none;
}

.alert-item.level-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
}

@keyframes alertPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.alert-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.alert-tank {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tank-icon {
  font-size: 20px;
}

.tank-name {
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
}

.alert-time {
  font-size: 12px;
  color: #94a3b8;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-ph {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ph-label {
  font-size: 13px;
  color: #94a3b8;
}

.ph-value {
  font-size: 20px;
  font-weight: 700;
}

.ph-low {
  color: #38bdf8;
}

.ph-high {
  color: #ef4444;
}

.alert-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.level-warning .type-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.level-danger .type-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.range-info {
  font-size: 11px;
  color: #64748b;
}

.alert-suggestion {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.suggestion-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.suggestion-text {
  color: #e2e8f0;
}

.dismiss-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 50%;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dismiss-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.no-alerts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  color: #22c55e;
  font-size: 14px;
}

.check-icon {
  font-size: 24px;
}
</style>
