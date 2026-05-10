<template>
  <div class="lightcurve-page">
    <el-card class="page-header-card">
      <div class="header-content">
        <h2>光变曲线</h2>
        <p>相位-星等图，展示变星的周期性亮度变化</p>
      </div>
    </el-card>

    <el-row :gutter="20" class="control-row">
      <el-col :span="8">
        <el-select
          v-model="selectedStarId"
          placeholder="选择变星"
          style="width: 100%"
          @change="handleStarChange"
        >
          <el-option
            v-for="star in starList"
            :key="star.id"
            :label="`${star.name} (${star.constellation})`"
            :value="star.id"
          />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="loadLightCurve" :loading="loading">
          <el-icon><Refresh /></el-icon>
          加载数据
        </el-button>
      </el-col>
      <el-col :span="4">
        <el-button @click="clearCache" :disabled="!selectedStarId">
          <el-icon><Delete /></el-icon>
          清除缓存
        </el-button>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-if="lightCurveData">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>相位-星等图</span>
              <div class="header-info">
                <el-tag v-if="lightCurveData.cachedAt" type="info" size="small">
                  缓存于: {{ formatTime(lightCurveData.cachedAt) }}
                </el-tag>
                <el-tag type="warning" size="small">
                  周期: {{ lightCurveData.periodDays }} 天
                </el-tag>
              </div>
            </div>
          </template>
          
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-if="lightCurveData && lightCurveData.observations.length > 0">
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>星基本信息</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="星名">
              {{ lightCurveData.starName }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="getStarTypeColor(lightCurveData.starType)">
                {{ lightCurveData.starType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="周期(天)">
              {{ lightCurveData.periodDays }}
            </el-descriptions-item>
            <el-descriptions-item label="观测点数量">
              <el-badge :value="lightCurveData.observations.length" class="item" :max="999">
                <span style="color: #667eea; font-weight: bold;">观测数据</span>
              </el-badge>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="data-table-card">
          <template #header>
            <div class="card-header">
              <span>最近观测数据</span>
              <el-tag type="info">最新 {{ recentObservations.length }} 条</el-tag>
            </div>
          </template>
          
          <el-table :data="recentObservations" stripe size="small">
            <el-table-column label="序号" type="index" width="50" />
            <el-table-column prop="phase" label="相位" width="80">
              <template #default="{ row }">
                {{ row.phase?.toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="magnitude" label="星等" width="100">
              <template #default="{ row }">
                <span class="mag-value">{{ row.magnitude?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="magnitudeError" label="误差" width="80">
              <template #default="{ row }">
                ±{{ row.magnitudeError?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="观测时间" width="140">
              <template #default="{ row }">
                {{ formatTime(row.observationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="observer" label="观测者" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row v-if="!lightCurveData && !loading">
      <el-col :span="24">
        <el-card>
          <el-empty description="请选择变星并加载光变曲线数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { getStarList } from '@/api/stars'
import { getLightCurveData, clearCache as clearCacheApi } from '@/api/observations'

const chartRef = ref(null)
let chartInstance = null

const starList = ref([])
const selectedStarId = ref(null)
const lightCurveData = ref(null)
const loading = ref(false)

const recentObservations = computed(() => {
  if (!lightCurveData.value?.observations) return []
  const obs = [...lightCurveData.value.observations]
  return obs
    .sort((a, b) => new Date(b.observationTime) - new Date(a.observationTime))
    .slice(0, 5)
})

const getStarTypeColor = (type) => {
  if (!type) return 'info'
  if (type.includes('造父')) return 'warning'
  if (type.includes('天琴座RR')) return 'success'
  return 'info'
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadStars = async () => {
  try {
    starList.value = await getStarList({})
  } catch (e) {
    console.error('加载变星列表失败')
  }
}

const handleStarChange = () => {
  lightCurveData.value = null
}

const initChart = () => {
  if (!chartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
}

const updateChart = () => {
  if (!chartInstance || !lightCurveData.value) return
  
  const observations = lightCurveData.value.observations
  const historicalData = lightCurveData.value.historicalData || []
  
  if (observations.length === 0) {
    chartInstance.setOption({
      title: {
        text: '暂无观测数据',
        left: 'center',
        top: 'middle'
      }
    })
    return
  }

  const allData = observations.map(obs => ({
    phase: obs.phase,
    magnitude: obs.magnitude,
    error: obs.magnitudeError,
    time: obs.observationTime,
    observer: obs.observer
  }))

  allData.sort((a, b) => a.phase - b.phase)

  const chartData = allData.map(item => [item.phase, item.magnitude])
  const errorBars = allData.map(item => [
    item.phase,
    item.magnitude - (item.error || 0),
    item.magnitude + (item.error || 0)
  ])

  const magValues = allData.map(d => d.magnitude)
  const minMag = Math.floor(Math.min(...magValues) - 0.5)
  const maxMag = Math.ceil(Math.max(...magValues) + 0.5)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.seriesType === 'line') {
          return `相位: ${params.data[0].toFixed(4)}<br/>星等: ${params.data[1].toFixed(2)}`
        }
        return ''
      }
    },
    grid: {
      left: '8%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      name: '相位 (Phase)',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      min: 0,
      max: 1,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      },
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      name: '星等 (V)',
      nameLocation: 'middle',
      nameGap: 40,
      type: 'value',
      min: maxMag,
      max: minMag,
      inverse: false,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '观测点',
        type: 'scatter',
        data: chartData,
        symbolSize: 12,
        itemStyle: {
          color: '#667eea',
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(102, 126, 234, 0.5)'
          }
        }
      },
      {
        name: '误差棒',
        type: 'custom',
        renderItem: function(params, api) {
          const categoryIndex = api.value(0)
          const start = api.coord([categoryIndex, api.value(1)])
          const end = api.coord([categoryIndex, api.value(2)])
          const width = 8
          
          return {
            type: 'group',
            children: [
              {
                type: 'line',
                shape: {
                  x1: start[0],
                  y1: start[1],
                  x2: end[0],
                  y2: end[1]
                },
                style: {
                  stroke: '#999',
                  lineWidth: 1.5
                }
              },
              {
                type: 'line',
                shape: {
                  x1: start[0] - width,
                  y1: start[1],
                  x2: start[0] + width,
                  y2: start[1]
                },
                style: {
                  stroke: '#999',
                  lineWidth: 1.5
                }
              },
              {
                type: 'line',
                shape: {
                  x1: end[0] - width,
                  y1: end[1],
                  x2: end[0] + width,
                  y2: end[1]
                },
                style: {
                  stroke: '#999',
                  lineWidth: 1.5
                }
              }
            ]
          }
        },
        data: errorBars,
        encode: {
          x: 0,
          y: [1, 2]
        },
        z: 0
      }
    ]
  }

  chartInstance.setOption(option)
}

const loadLightCurve = async () => {
  if (!selectedStarId.value) {
    ElMessage.warning('请先选择变星')
    return
  }

  loading.value = true
  try {
    lightCurveData.value = await getLightCurveData(selectedStarId.value)
    
    await nextTick()
    if (!chartInstance) {
      initChart()
    }
    updateChart()
    
    ElMessage.success('光变曲线数据加载成功')
  } catch (e) {
    ElMessage.error('加载光变曲线数据失败')
  } finally {
    loading.value = false
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除该变星的光变曲线缓存吗？',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await clearCacheApi(selectedStarId.value)
    ElMessage.success('缓存已清除，请重新加载数据')
    lightCurveData.value = null
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('清除缓存失败')
    }
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  loadStars()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.lightcurve-page {
  padding: 10px;
}

.page-header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  border: none;
}

.page-header-card :deep(.el-card__body) {
  padding: 20px;
}

.page-header-card h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.page-header-card p {
  margin: 0;
  opacity: 0.9;
}

.control-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-info {
  display: flex;
  gap: 10px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 500px;
}

.info-card,
.data-table-card {
  margin-bottom: 20px;
}

.mag-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}
</style>
