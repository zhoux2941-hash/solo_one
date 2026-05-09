<template>
  <transition name="alert-fade">
    <div
      v-if="visible"
      class="conflict-alert"
      :class="{ 'is-leaving': isLeaving }"
    >
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <div class="alert-header">
          <span class="alert-title">情感冲突预警</span>
          <span class="alert-time">{{ formatTime(alert?.timestamp) }}</span>
        </div>
        <p class="alert-message">{{ alert?.message }}</p>
        <div class="alert-details" v-if="alert">
          <div class="emotion-comparison">
            <div class="emotion-item current">
              <span class="emotion-label">您</span>
              <span class="emotion-tag" :class="getEmotionClass(alert.currentUserEmotion)">
                {{ getEmotionEmoji(alert.currentUserEmotion) }} {{ getEmotionText(alert.currentUserEmotion) }}
              </span>
              <span class="emotion-score">{{ alert.currentUserScore?.toFixed(2) }}</span>
            </div>
            <div class="vs-divider">VS</div>
            <div class="emotion-item other">
              <span class="emotion-label">{{ alert.otherUserName || '协作者' }}</span>
              <span class="emotion-tag" :class="getEmotionClass(alert.otherUserEmotion)">
                {{ getEmotionEmoji(alert.otherUserEmotion) }} {{ getEmotionText(alert.otherUserEmotion) }}
              </span>
              <span class="emotion-score">{{ alert.otherUserScore?.toFixed(2) }}</span>
            </div>
          </div>
          <div class="difference-bar">
            <div class="diff-label">情感差异</div>
            <div class="diff-indicator">
              <div class="diff-fill" :style="{ width: `${alert.scoreDifference * 100}%` }"></div>
            </div>
            <div class="diff-value">{{ alert.scoreDifference?.toFixed(2) }}</div>
          </div>
        </div>
        <div class="alert-actions">
          <button class="action-btn ignore" @click="dismiss">
            忽略
          </button>
          <button class="action-btn chat" @click="handleContact">
            💬 联系协作者
          </button>
        </div>
      </div>
      <button class="close-btn" @click="dismiss">×</button>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  alert: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['dismiss', 'contact'])

const visible = ref(false)
const isLeaving = ref(false)
let autoDismissTimer = null

watch(() => props.alert, (newAlert) => {
  if (newAlert) {
    visible.value = true
    isLeaving.value = false
    startAutoDismiss()
  } else {
    dismiss()
  }
}, { immediate: true })

const startAutoDismiss = () => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
  }
  
  autoDismissTimer = setTimeout(() => {
    dismiss()
  }, 15000)
}

const dismiss = () => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
  }
  
  isLeaving.value = true
  setTimeout(() => {
    visible.value = false
    emit('dismiss')
  }, 300)
}

const handleContact = () => {
  emit('contact', props.alert)
  dismiss()
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getEmotionClass = (emotion) => {
  if (!emotion) return 'neutral'
  switch (emotion.toUpperCase()) {
    case 'POSITIVE': return 'positive'
    case 'NEGATIVE': return 'negative'
    default: return 'neutral'
  }
}

const getEmotionText = (emotion) => {
  if (!emotion) return '中立'
  switch (emotion.toUpperCase()) {
    case 'POSITIVE': return '积极'
    case 'NEGATIVE': return '消极'
    default: return '中立'
  }
}

const getEmotionEmoji = (emotion) => {
  if (!emotion) return '😐'
  switch (emotion.toUpperCase()) {
    case 'POSITIVE': return '😊'
    case 'NEGATIVE': return '😢'
    default: return '😐'
  }
}

onMounted(() => {
  if (props.alert) {
    visible.value = true
    startAutoDismiss()
  }
})

onBeforeUnmount(() => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
  }
})
</script>

<style scoped>
.conflict-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 380px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2);
  display: flex;
  padding: 16px;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

.conflict-alert.is-leaving {
  animation: slideOut 0.3s ease-in forwards;
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

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.alert-icon {
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
}

.alert-time {
  font-size: 12px;
  color: #9ca3af;
}

.alert-message {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.alert-details {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.emotion-comparison {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.emotion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.emotion-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.emotion-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.emotion-tag.positive {
  background: #dcfce7;
  color: #15803d;
}

.emotion-tag.negative {
  background: #fee2e2;
  color: #dc2626;
}

.emotion-tag.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.emotion-score {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.vs-divider {
  font-size: 12px;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  padding: 4px 8px;
  border-radius: 8px;
}

.difference-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

.diff-indicator {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.diff-fill {
  height: 100%;
  background: linear-gradient(90deg, #fca5a5, #ef4444);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.diff-value {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  font-family: monospace;
  min-width: 40px;
  text-align: right;
}

.alert-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.action-btn.ignore {
  background: transparent;
  color: #6b7280;
}

.action-btn.ignore:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.chat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.chat:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>
