<template>
  <div class="heat-map-page">
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <span>岗位需求热度图</span>
          <div>
            <el-select v-model="selectedPosition" placeholder="选择岗位" style="width: 200px; margin-right: 10px;">
              <el-option label="全部岗位" value="all" />
              <el-option 
                v-for="pos in positionList" 
                :key="pos.positionId" 
                :label="pos.positionName" 
                :value="pos.positionId" 
              />
            </el-select>
            <el-button type="primary" @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="loading" style="text-align: center; padding: 100px;">
        <el-icon class="is-loading" style="font-size: 40px;"><Loading /></el-icon>
        <p style="margin-top: 10px; color: #909399;">加载中...</p>
      </div>

      <div v-else-if="heatMapData && heatMapData.positions && heatMapData.positions.length > 0">
        <div v-if="selectedPosition === 'all'" class="all-positions-chart">
          <el-tabs v-model="activeTab">
            <el-tab-pane 
              v-for="pos in heatMapData.positions" 
              :key="pos.positionId" 
              :label="pos.positionName" 
              :name="String(pos.positionId)"
            >
              <div class="chart-container">
                <v-chart class="chart" :option="getChartOption(pos)" autoresize />
              </div>
              <div class="stats-info">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-statistic title="需求人数" :value="pos.requiredCount" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="已分配班次" :value="getTotalAssigned(pos)" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="覆盖天数" :value="heatMapData.dates.length" />
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <div v-else class="single-position-chart">
          <div class="chart-container">
            <v-chart class="chart" :option="currentChartOption" autoresize />
          </div>
          <div class="stats-info">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="需求人数" :value="currentPosition?.requiredCount || 0" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="已分配班次" :value="getTotalAssigned(currentPosition)" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="覆盖天数" :value="heatMapData.dates.length" />
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="暂无排班数据" />
      </div>
    </el-card>

    <el-card>
      <template #header>
        <span>热度图例说明</span>
      </template>
      <div class="legend-explain">
        <div class="legend-item">
          <span class="legend-color light"></span>
          <span>低热度（班次少）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color medium"></span>
          <span>中热度（班次中等）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color dark"></span>
          <span>高热度（班次多，需重点关注）</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/utils/api'

const heatMapData = ref(null)
const loading = ref(false)
const selectedPosition = ref('all')
const activeTab = ref('')

const positionList = computed(() => {
  if (!heatMapData.value || !heatMapData.value.positions) return []
  return heatMapData.value.positions
})

const currentPosition = computed(() => {
  if (!heatMapData.value || !heatMapData.value.positions) return null
  return heatMapData.value.positions.find(p => p.positionId === selectedPosition.value)
})

const currentChartOption = computed(() => {
  if (!currentPosition.value) return {}
  return getChartOption(currentPosition.value)
})

function getTotalAssigned(position) {
  if (!position || !position.data) return 0
  return position.data.reduce((sum, item) => sum + (item[2] || 0), 0)
}

function getChartOption(position) {
  const dates = heatMapData.value.dates || []
  const timeSlots = heatMapData.value.timeSlots || []
  const data = position.data || []

  return {
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const date = dates[params.data[0]]
        const time = timeSlots[params.data[1]]
        const count = params.data[2]
        return `${date}<br/>${time}<br/><b>${count} 人</b>`
      }
    },
    grid: {
      left: '12%',
      right: '10%',
      top: '5%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: 45,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'category',
      data: timeSlots,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontSize: 11
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      },
      text: ['高热度', '低热度'],
      textStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: position.positionName,
      type: 'heatmap',
      data: data,
      label: {
        show: true,
        fontSize: 12,
        color: '#000'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
}

async function fetchHeatMapData() {
  loading.value = true
  try {
    const response = await api.get('/admin/heat-map/by-position')
    if (response.data.success) {
      heatMapData.value = response.data.data
      if (heatMapData.value && heatMapData.value.positions && heatMapData.value.positions.length > 0) {
        activeTab.value = String(heatMapData.value.positions[0].positionId)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchHeatMapData()
}

watch(activeTab, (newVal) => {
  if (newVal && selectedPosition.value === 'all') {
    selectedPosition.value = parseInt(newVal)
  }
})

watch(selectedPosition, (newVal) => {
  if (newVal === 'all') {
    if (heatMapData.value && heatMapData.value.positions && heatMapData.value.positions.length > 0) {
      activeTab.value = String(heatMapData.value.positions[0].positionId)
    }
  } else {
    activeTab.value = String(newVal)
  }
})

onMounted(() => {
  fetchHeatMapData()
})
</script>

<style scoped>
.heat-map-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 450px;
  margin: 20px 0;
}

.chart {
  width: 100%;
  height: 100%;
}

.stats-info {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-top: 20px;
}

.empty-state {
  padding: 60px 0;
}

.legend-explain {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-color {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.legend-color.light {
  background: #e0f3f8;
}

.legend-color.medium {
  background: #74add1;
}

.legend-color.dark {
  background: #313695;
}
</style>
