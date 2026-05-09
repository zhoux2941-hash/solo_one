<template>
  <div class="wordcloud-container">
    <h3 class="wordcloud-title">词云分析</h3>
    <div class="wordcloud-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'positive' }"
        @click="activeTab = 'positive'"
      >
        😊 积极词汇
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'negative' }"
        @click="activeTab = 'negative'"
      >
        😢 消极词汇
      </button>
    </div>
    <div ref="wordcloudRef" class="wordcloud-area"></div>
    <div v-if="!hasData" class="empty-state">
      暂无词云数据
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import WordCloud from 'wordcloud2'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({ positiveWords: [], negativeWords: [] })
  }
})

const activeTab = ref('positive')
const wordcloudRef = ref(null)
let currentChart = null

const hasData = () => {
  const words = activeTab.value === 'positive' 
    ? props.data?.positiveWords 
    : props.data?.negativeWords
  return words && words.length > 0
}

const getCurrentWords = () => {
  const words = activeTab.value === 'positive' 
    ? props.data?.positiveWords 
    : props.data?.negativeWords
  
  if (!words || words.length === 0) return []
  
  const maxWeight = Math.max(...words.map(w => w.weight))
  const minWeight = Math.min(...words.map(w => w.weight))
  
  return words.map(w => {
    const normalized = minWeight === maxWeight 
      ? 1 
      : (w.weight - minWeight) / (maxWeight - minWeight)
    const fontSize = 14 + normalized * 28
    return [w.text, fontSize]
  })
}

const getColor = () => {
  const colors = activeTab.value === 'positive'
    ? ['#22C55E', '#16A34A', '#15803D', '#4ADE80', '#86EFAC']
    : ['#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FCA5A5']
  return colors[Math.floor(Math.random() * colors.length)]
}

const renderWordCloud = async () => {
  await nextTick()
  
  if (!wordcloudRef.value) return
  
  const words = getCurrentWords()
  
  if (words.length === 0) {
    return
  }

  if (currentChart) {
    currentChart = null
  }

  const container = wordcloudRef.value
  const width = container.offsetWidth || 400
  const height = container.offsetHeight || 300

  WordCloud(container, {
    list: words,
    gridSize: 8,
    weightFactor: 1,
    fontFamily: 'Inter, sans-serif',
    color: getColor,
    rotateRatio: 0.3,
    rotationSteps: 2,
    backgroundColor: 'transparent',
    shuffle: true,
    wait: 50,
    drawOutOfBound: false,
    shrinkToFit: true,
    minSize: 12
  })
}

watch([activeTab, () => props.data], () => {
  renderWordCloud()
}, { deep: true })

onMounted(() => {
  renderWordCloud()
  window.addEventListener('resize', renderWordCloud)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderWordCloud)
  currentChart = null
})
</script>

<style scoped>
.wordcloud-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.wordcloud-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.wordcloud-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #D1D5DB;
  background: #F3F4F6;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.wordcloud-area {
  width: 100%;
  height: 280px;
  position: relative;
}

.wordcloud-area :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
