<template>
  <div class="container">
    <header class="header">
      <h1>自助洗车机泡沫浓度监控系统</h1>
      <p class="subtitle">实时监控 C1~C4 洗车机泡沫混合液浓度，正常范围: 2% ~ 5%</p>
    </header>

    <div class="toolbar">
      <button class="btn btn-primary" @click="refreshData">
        <span>🔄</span>
        <span>刷新数据</span>
      </button>
      <button class="btn btn-secondary" @click="generateMockData">
        <span>📊</span>
        <span>生成模拟数据</span>
      </button>
      <button class="btn btn-secondary" @click="evictCache">
        <span>🧹</span>
        <span>清除缓存</span>
      </button>
    </div>

    <div v-if="loading" class="loading">数据加载中...</div>

    <template v-else>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">总记录数</div>
          <div class="stat-value">{{ totalRecords }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总超标次数</div>
          <div class="stat-value danger">{{ totalAbnormal }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">异常机器</div>
          <div class="stat-value danger">{{ abnormalMachines }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最高超标率</div>
          <div class="stat-value danger">{{ maxAbnormalRate }}%</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">浓度异常时段热力图</div>
        <HeatmapChart :heatmap-data="heatmapData" />
      </div>

      <div class="card">
        <div class="card-title">过去 24 小时浓度变化趋势</div>
        <FoamChart :chart-data="groupedData" />
      </div>

      <div class="card">
        <div class="card-title">超标次数统计</div>
        <StatsTable :stats-data="statsData" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { foamApi } from './api/foamService'
import FoamChart from './components/FoamChart.vue'
import StatsTable from './components/StatsTable.vue'
import HeatmapChart from './components/HeatmapChart.vue'

const loading = ref(false)
const groupedData = ref({})
const statsData = ref([])
const heatmapData = ref(null)

const totalRecords = computed(() => {
  return statsData.value.reduce((sum, s) => sum + s.totalRecords, 0)
})

const totalAbnormal = computed(() => {
  return statsData.value.reduce((sum, s) => sum + s.abnormalCount, 0)
})

const abnormalMachines = computed(() => {
  return statsData.value.filter(s => s.abnormalCount > 0).length
})

const maxAbnormalRate = computed(() => {
  if (statsData.value.length === 0) return 0
  return Math.max(...statsData.value.map(s => s.abnormalRate))
})

const fetchData = async () => {
  loading.value = true
  try {
    const [groupedRes, statsRes, heatmapRes] = await Promise.all([
      foamApi.getGroupedHistory(),
      foamApi.getStats(),
      foamApi.getHeatmap()
    ])

    if (groupedRes.code === 200) {
      groupedData.value = groupedRes.data || {}
    }

    if (statsRes.code === 200) {
      statsData.value = statsRes.data || []
    }

    if (heatmapRes.code === 200) {
      heatmapData.value = heatmapRes.data
    }
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchData()
}

const generateMockData = async () => {
  loading.value = true
  try {
    await foamApi.generateMockData()
    await foamApi.evictHeatmapCache()
    await fetchData()
  } catch (error) {
    console.error('Failed to generate mock data:', error)
  } finally {
    loading.value = false
  }
}

const evictCache = async () => {
  try {
    await foamApi.evictHeatmapCache()
    await fetchData()
  } catch (error) {
    console.error('Failed to evict cache:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>
