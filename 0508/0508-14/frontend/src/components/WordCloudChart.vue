<template>
  <div>
    <div class="card-title">搜索词云</div>
    <canvas ref="canvasRef" class="wordcloud-container"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import WordCloud from 'wordcloud2'
import { analyticsApi } from '../utils/api'

const canvasRef = ref(null)
const wordList = ref([])

const loadWordCloud = async () => {
  try {
    const response = await analyticsApi.getWordCloud(50)
    const data = response.data
    wordList.value = (data.words || []).map(item => [item.text, item.value])
  } catch (error) {
    console.error('获取词云数据失败', error)
  }
}

const renderWordCloud = () => {
  if (!canvasRef.value && wordList.value.length === 0) return

  const colors = [
    '#667eea', '#764ba2', '#409eff', '#67c23a',
    '#e6a23c', '#f56c6c', '#909399', '#06b6d4'
  ]

  WordCloud(canvasRef.value, {
    list: wordList.value,
    gridSize: 8,
    weightFactor: (size) => {
      return Math.pow(size, 0.8) * 3
    },
    fontFamily: 'Microsoft YaHei, sans-serif',
    color: () => colors[Math.floor(Math.random() * colors.length)],
    rotateRatio: 0.3,
    minSize: 12,
    background: 'transparent',
    drawOutOfBound: false
  })
}

onMounted(async () => {
  await loadWordCloud()
  setTimeout(renderWordCloud, 100)
})
</script>

<style scoped>
.wordcloud-container {
  canvas {
    width: 100%;
    height: 100%;
  }
}
</style>
