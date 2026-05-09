<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="logo-icon">🎨</span>
          <div class="header-text">
            <h1>幼儿园手工区材料消耗趋势仪表盘</h1>
            <p class="header-subtitle">实时监控过去 7 天材料消耗情况</p>
          </div>
        </div>
        <div class="header-actions">
          <WarningPanel :data="warningData" />
          <button class="refresh-btn" @click="fetchData" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
            {{ loading ? '加载中...' : '刷新数据' }}
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div v-if="error" class="error-message">
        {{ error }}
        <button class="retry-btn" @click="fetchData">重试</button>
      </div>

      <div v-if="!error" class="dashboard-content">
        <section class="cards-section">
          <MaterialCard
            v-for="(item, index) in shareData.items"
            :key="item.name"
            :name="item.name"
            :amount="item.amount"
            :unit="item.unit"
            :percentage="item.percentage"
            :color="colors[index]"
            :icon="icons[item.name]"
          />
        </section>

        <section class="charts-section">
          <div class="chart-wrapper trend-chart">
            <TrendChart :data="trendData" />
          </div>
          <div class="chart-wrapper share-chart">
            <ShareChart :data="shareData" />
          </div>
        </section>
      </div>
    </main>

    <footer class="app-footer">
      <p>© 2026 幼儿园材料管理系统 | 数据更新时间: {{ lastUpdateTime }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTrendData, getShareData, getWarningData } from './api/material.js'
import MaterialCard from './components/MaterialCard.vue'
import TrendChart from './components/TrendChart.vue'
import ShareChart from './components/ShareChart.vue'
import WarningPanel from './components/WarningPanel.vue'

const loading = ref(false)
const error = ref('')
const lastUpdateTime = ref('')

const trendData = ref({
  dates: [],
  materials: []
})

const shareData = ref({
  total: 0,
  items: []
})

const warningData = ref({
  hasWarning: false,
  warningCount: 0,
  generatedAt: null,
  fromCache: false,
  warnings: []
})

const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']

const icons = {
  '彩纸': '📄',
  '胶水': '🧴',
  '亮片': '✨',
  '毛根': '🎀'
}

const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [trendResult, shareResult, warningResult] = await Promise.all([
      getTrendData(),
      getShareData(),
      getWarningData()
    ])

    trendData.value = trendResult
    shareData.value = shareResult
    warningData.value = warningResult
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
  } catch (err) {
    console.error('获取数据失败:', err)
    error.value = '无法连接到后端服务，请确保后端服务已启动 (http://localhost:8080)'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 42px;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.header-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #888;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.app-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.error-message {
  background: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 12px;
  padding: 20px;
  color: #c62828;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cards-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  min-height: 450px;
}

.chart-wrapper {
  min-height: 400px;
}

.app-footer {
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #eee;
}

.app-footer p {
  margin: 0;
  font-size: 12px;
  color: #888;
}

@media (max-width: 1024px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-text h1 {
    font-size: 18px;
  }
}
</style>
