<template>
  <div>
    <div class="card-title">文档分类点击热力图</div>
    <div v-if="heatmapData.length > 0" class="heatmap-container">
      <div
        v-for="item in heatmapData"
        :key="item.category"
        class="heatmap-item"
        :style="getHeatmapStyle(item.intensity)"
      >
        <div class="heatmap-category">{{ item.category }}</div>
        <div class="heatmap-count">{{ item.clickCount }}</div>
      </div>
    </div>
    <div v-else class="empty-state">
      <el-icon><DataLine /></el-icon>
      <p>暂无点击数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
import { analyticsApi } from '../utils/api'

const heatmapData = ref([])

const colors = [
  { min: 0, max: 0.25, color: '#a5d8ff' },
  { min: 0.25, max: 0.5, color: '#74c0fc' },
  { min: 0.5, max: 0.75, color: '#4dabf7' },
  { min: 0.75, max: 1, color: '#1c7ed6' }
]

const getHeatmapStyle = (intensity) => {
  let color = '#a5d8ff'
  for (const range of colors) {
    if (intensity >= range.min && intensity <= range.max) {
      color = range.color
      break
    }
  }
  if (intensity === 0) {
    color = '#e9ecef'
  }
  return {
    backgroundColor: color,
    minHeight: '100px'
  }
}

const loadHeatmap = async () => {
  try {
    const response = await analyticsApi.getClickHeatmap()
    heatmapData.value = response.data
  } catch (error) {
    console.error('获取热力图数据失败', error)
  }
}

onMounted(() => {
  loadHeatmap()
})
</script>

<style scoped>
</style>
