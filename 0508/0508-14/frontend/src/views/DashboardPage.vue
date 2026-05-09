<template>
  <div class="main-container">
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-label">24小时搜索量</div>
        <div class="stat-value">{{ summary.totalSearches24h || 0 }}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">24小时无结果率</div>
        <div class="stat-value">{{ summary.noResultRate24h || 0 }}%</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">文档总数</div>
        <div class="stat-value">{{ summary.totalDocuments || 0 }}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">总点击次数</div>
        <div class="stat-value">{{ summary.totalClicks || 0 }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="tabs-container">
      <el-tab-pane label="搜索量趋势" name="volume">
        <VolumeChart />
      </el-tab-pane>
      <el-tab-pane label="搜索词云" name="wordcloud">
        <WordCloudChart />
      </el-tab-pane>
      <el-tab-pane label="点击热力图" name="heatmap">
        <ClickHeatmap />
      </el-tab-pane>
      <el-tab-pane label="无结果率趋势" name="noresult">
        <NoResultChart />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { analyticsApi } from '../utils/api'
import VolumeChart from '../components/VolumeChart.vue'
import WordCloudChart from '../components/WordCloudChart.vue'
import ClickHeatmap from '../components/ClickHeatmap.vue'
import NoResultChart from '../components/NoResultChart.vue'

const activeTab = ref('volume')
const summary = ref({})

const loadSummary = async () => {
  try {
    const response = await analyticsApi.getSummary()
    summary.value = response.data
  } catch (error) {
    console.error('获取汇总数据失败', error)
  }
}

onMounted(() => {
  loadSummary()
})
</script>

<style scoped>
</style>
