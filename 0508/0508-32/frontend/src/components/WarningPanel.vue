<template>
  <div class="warning-panel" :class="{ 'has-warnings': data.hasWarning }">
    <button
      class="warning-trigger"
      @click="togglePanel"
      :class="{ 'has-warnings': data.hasWarning, 'critical': hasCritical }"
    >
      <span class="warning-icon">⚠️</span>
      <span v-if="data.hasWarning" class="warning-badge">{{ data.warningCount }}</span>
    </button>

    <div v-if="isOpen" class="warning-dropdown">
      <div class="dropdown-header">
        <h4>缺货预警</h4>
        <span v-if="data.fromCache" class="cache-badge">缓存</span>
      </div>

      <div v-if="!data.hasWarning" class="no-warnings">
        <span class="success-icon">✅</span>
        <p>所有材料库存充足</p>
      </div>

      <div v-else class="warning-list">
        <div
          v-for="warning in data.warnings"
          :key="warning.materialType"
          class="warning-item"
          :class="warning.warningLevel.toLowerCase()"
        >
          <div class="warning-level" :class="warning.warningLevel.toLowerCase()">
            {{ getLevelText(warning.warningLevel) }}
          </div>
          <div class="warning-content">
            <div class="warning-title">{{ warning.materialName }}</div>
            <div class="warning-details">
              <span class="detail-item">
                当前: {{ warning.currentStock }} {{ warning.unit }}
              </span>
              <span class="detail-item">
                阈值: {{ warning.threshold }} {{ warning.unit }}
              </span>
            </div>
            <div class="warning-prediction">
              预计 {{ warning.predictedShortageDate }} 低于阈值
            </div>
          </div>
        </div>
      </div>

      <div class="dropdown-footer">
        生成时间: {{ formatTime(data.generatedAt) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      hasWarning: false,
      warningCount: 0,
      generatedAt: null,
      fromCache: false,
      warnings: []
    })
  }
})

const isOpen = ref(false)

const hasCritical = computed(() => {
  return props.data.warnings?.some(w => w.warningLevel === 'CRITICAL') || false
})

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const getLevelText = (level) => {
  switch (level) {
    case 'CRITICAL':
      return '紧急'
    case 'WARNING':
      return '警告'
    case 'INFO':
      return '提醒'
    default:
      return '未知'
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.warning-panel {
  position: relative;
}

.warning-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.warning-trigger:hover {
  background: #eeeeee;
}

.warning-trigger.has-warnings {
  background: #fff3e0;
  border-color: #ff9800;
}

.warning-trigger.has-warnings:hover {
  background: #ffe0b2;
}

.warning-trigger.critical {
  background: #ffebee;
  border-color: #f44336;
  animation: pulse-critical 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(244, 67, 54, 0); }
}

.warning-icon {
  font-size: 18px;
}

.warning-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #f44336;
  color: white;
  font-size: 11px;
  font-weight: bold;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dropdown-in 0.2s ease;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.cache-badge {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 11px;
  border-radius: 4px;
}

.warning-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.warning-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #fafafa;
  border-left: 4px solid #9e9e9e;
  transition: background 0.2s;
}

.warning-item:hover {
  background: #f5f5f5;
}

.warning-item.critical {
  border-left-color: #f44336;
  background: #ffebee;
}

.warning-item.critical:hover {
  background: #ffcdd2;
}

.warning-item.warning {
  border-left-color: #ff9800;
  background: #fff3e0;
}

.warning-item.warning:hover {
  background: #ffe0b2;
}

.warning-item.info {
  border-left-color: #2196f3;
  background: #e3f2fd;
}

.warning-item.info:hover {
  background: #bbdefb;
}

.warning-level {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  align-self: flex-start;
  white-space: nowrap;
}

.warning-level.critical {
  background: #f44336;
  color: white;
}

.warning-level.warning {
  background: #ff9800;
  color: white;
}

.warning-level.info {
  background: #2196f3;
  color: white;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.warning-details {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.detail-item {
  font-size: 12px;
  color: #666;
}

.warning-prediction {
  font-size: 12px;
  color: #f44336;
  font-weight: 500;
}

.no-warnings {
  padding: 40px 20px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.no-warnings p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #999;
  text-align: right;
}
</style>
