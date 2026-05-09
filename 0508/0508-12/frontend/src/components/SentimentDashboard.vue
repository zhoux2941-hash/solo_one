<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2 class="dashboard-title">📊 情感分析看板</h2>
      <button class="refresh-btn" @click="refreshData" :disabled="isLoading">
        <el-icon v-if="isLoading"><Loading /></el-icon>
        刷新数据
      </button>
    </div>
    
    <div class="dashboard-grid">
      <div class="main-chart">
        <SentimentTimelineChart :data="sentimentHistory" />
      </div>
      
      <div class="side-charts">
        <SentimentHeatmap :data="paragraphSentiment" />
      </div>
      
      <div class="wordcloud-section">
        <WordCloudDisplay :data="wordCloudData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { documentApi } from '@/api'
import SentimentTimelineChart from './SentimentTimelineChart.vue'
import SentimentHeatmap from './SentimentHeatmap.vue'
import WordCloudDisplay from './WordCloudDisplay.vue'

const props = defineProps({
  docId: {
    type: [Number, String],
    required: true
  }
})

const isLoading = ref(false)
const sentimentHistory = ref({ docId: null, series: [] })
const paragraphSentiment = ref([])
const wordCloudData = ref({ positiveWords: [], negativeWords: [] })

let refreshInterval = null

const fetchAllData = async () => {
  if (!props.docId) return
  
  isLoading.value = true
  try {
    const [historyRes, paragraphRes, wordcloudRes] = await Promise.all([
      documentApi.getSentimentHistory(props.docId),
      documentApi.getParagraphSentiment(props.docId),
      documentApi.getWordCloud(props.docId)
    ])
    
    sentimentHistory.value = historyRes.data
    paragraphSentiment.value = paragraphRes.data
    wordCloudData.value = wordcloudRes.data
  } catch (error) {
    console.error('Failed to fetch sentiment data:', error)
    ElMessage.error('获取情感数据失败')
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  fetchAllData()
}

onMounted(() => {
  fetchAllData()
  
  refreshInterval = setInterval(() => {
    fetchAllData()
  }, 30000)
})

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #F3F4F6;
  min-height: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
}

.main-chart {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.side-charts {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
}

.wordcloud-section {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .main-chart,
  .side-charts,
  .wordcloud-section {
    grid-column: 1;
  }
  
  .side-charts {
    grid-row: 2;
  }
  
  .wordcloud-section {
    grid-row: 3;
  }
}
</style>
