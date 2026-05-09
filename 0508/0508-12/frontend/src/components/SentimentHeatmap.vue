<template>
  <div class="heatmap-container">
    <h3 class="heatmap-title">段落情感热力图</h3>
    <div v-if="!data || data.length === 0" class="empty-state">
      暂无段落情感数据
    </div>
    <div v-else class="heatmap-content">
      <div
        v-for="(paragraph, index) in data"
        :key="index"
        class="paragraph-item"
        :style="getParagraphStyle(paragraph)"
      >
        <div class="paragraph-header">
          <span class="paragraph-index">第 {{ index + 1 }} 段</span>
          <span class="paragraph-emotion" :class="paragraph.emotion.toLowerCase()">
            {{ getEmotionText(paragraph.emotion) }}
          </span>
        </div>
        <p class="paragraph-text">{{ paragraph.text }}</p>
        <div class="paragraph-footer">
          <div class="score-bar">
            <div
              class="score-fill"
              :style="getScoreBarStyle(paragraph)"
            ></div>
          </div>
          <span class="score-value">{{ paragraph.sentimentScore.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const getEmotionText = (emotion) => {
  const map = {
    'POSITIVE': '😊 积极',
    'NEGATIVE': '😢 消极',
    'NEUTRAL': '😐 中立'
  }
  return map[emotion] || emotion
}

const getParagraphStyle = (paragraph) => {
  const intensity = paragraph.intensity || 0
  let bgColor = 'rgba(255, 255, 255, 1)'
  let borderColor = 'rgba(229, 231, 235, 1)'

  if (paragraph.emotion === 'POSITIVE') {
    bgColor = `rgba(34, 197, 94, ${0.05 + intensity * 0.15})`
    borderColor = `rgba(34, 197, 94, ${0.3 + intensity * 0.5})`
  } else if (paragraph.emotion === 'NEGATIVE') {
    bgColor = `rgba(239, 68, 68, ${0.05 + intensity * 0.15})`
    borderColor = `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`
  }

  return {
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderWidth: `${1 + intensity * 2}px`
  }
}

const getScoreBarStyle = (paragraph) => {
  const score = paragraph.sentimentScore
  const percentage = ((score + 1) / 2) * 100
  
  let bgColor = '#9CA3AF'
  if (score > 0.2) {
    bgColor = '#22C55E'
  } else if (score < -0.2) {
    bgColor = '#EF4444'
  }

  return {
    width: `${percentage}%`,
    backgroundColor: bgColor
  }
}
</script>

<style scoped>
.heatmap-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-height: 500px;
  overflow-y: auto;
}

.heatmap-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
  padding-bottom: 10px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.heatmap-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paragraph-item {
  border: 1px solid;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.paragraph-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.paragraph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.paragraph-index {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.paragraph-emotion {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.paragraph-emotion.positive {
  background: rgba(34, 197, 94, 0.1);
  color: #16A34A;
}

.paragraph-emotion.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}

.paragraph-emotion.neutral {
  background: rgba(156, 163, 175, 0.1);
  color: #6B7280;
}

.paragraph-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paragraph-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-bar {
  flex: 1;
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.score-value {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}
</style>
