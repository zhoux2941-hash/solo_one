<template>
  <div class="container">
    <header class="header">
      <h1>🌌 拟合结果分享</h1>
      <p class="subtitle">查看分享的系外行星凌星数据</p>
    </header>

    <div v-if="loading" class="loading-container">
      <el-loading-spinner v-if="loading" :size="50" />
      <p>正在加载数据...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="goHome">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="fitData" class="content">
      <div class="main-panel">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📈 光变曲线对比</span>
              <div class="chart-legend">
                <span class="legend-item">
                  <span class="legend-dot observed"></span>
                  观测数据
                </span>
                <span class="legend-item">
                  <span class="legend-dot fitted"></span>
                  拟合曲线
                </span>
              </div>
            </div>
          </template>
          
          <div ref="chartRef" class="chart-container"></div>
        </el-card>

        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>📊 拟合统计</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">χ²</span>
                <span class="stat-value">{{ fitData.chiSquared?.toFixed(4) || 'N/A' }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">匹配度</span>
                <span class="stat-value" :class="getMatchClass(fitData.matchingDegree)">
                  {{ fitData.matchingDegree?.toFixed(2) || 'N/A' }}%
                </span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">噪声水平</span>
                <span class="stat-value">{{ (fitData.noiseLevel * 100).toFixed(0) }}%</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">创建时间</span>
                <span class="stat-value">{{ formatDate(fitData.createdAt) }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="params-card">
          <template #header>
            <div class="card-header">
              <span>⚙️ 系统参数</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <h3>恒星参数</h3>
              <div class="param-row">
                <span class="param-label">半径:</span>
                <span class="param-value">{{ fitData.starRadius?.toFixed(2) || 'N/A' }} R☉</span>
              </div>
              <div class="param-row">
                <span class="param-label">温度:</span>
                <span class="param-value">{{ fitData.starTemperature?.toFixed(0) || 'N/A' }} K</span>
              </div>
            </el-col>
            <el-col :span="12">
              <h3>真实行星参数</h3>
              <div class="param-row">
                <span class="param-label">半径:</span>
                <span class="param-value">{{ fitData.planetRadius?.toFixed(2) || 'N/A' }} R⊕</span>
              </div>
              <div class="param-row">
                <span class="param-label">轨道周期:</span>
                <span class="param-value">{{ fitData.orbitalPeriod?.toFixed(2) || 'N/A' }} 天</span>
              </div>
              <div class="param-row">
                <span class="param-label">轨道倾角:</span>
                <span class="param-value">{{ fitData.inclination?.toFixed(1) || 'N/A' }}°</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="fit-params-card">
          <template #header>
            <div class="card-header">
              <span>🔬 拟合参数</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="fit-param">
                <span class="fit-param-label">行星半径</span>
                <div class="fit-param-values">
                  <span class="fitted-value">{{ fitData.fittedPlanetRadius?.toFixed(2) || 'N/A' }} R⊕</span>
                  <span class="true-value">
                    (真实值: {{ fitData.planetRadius?.toFixed(2) || 'N/A' }} R⊕)
                  </span>
                  <span
                    :class="getAccuracyClass(
                      fitData.fittedPlanetRadius,
                      fitData.planetRadius,
                      0.5
                    )"
                  >
                    {{ getAccuracyText(fitData.fittedPlanetRadius, fitData.planetRadius, 0.5) }}
                  </span>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="fit-param">
                <span class="fit-param-label">轨道倾角</span>
                <div class="fit-param-values">
                  <span class="fitted-value">{{ fitData.fittedInclination?.toFixed(1) || 'N/A' }}°</span>
                  <span class="true-value">
                    (真实值: {{ fitData.inclination?.toFixed(1) || 'N/A' }}°)
                  </span>
                  <span
                    :class="getAccuracyClass(
                      fitData.fittedInclination,
                      fitData.inclination,
                      1
                    )"
                  >
                    {{ getAccuracyText(fitData.fittedInclination, fitData.inclination, 1) }}
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <div class="actions">
          <el-button type="primary" @click="goHome" size="large">
            🔙 返回模拟器
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { fitApi } from '../api'

export default {
  name: 'ShareView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const chartRef = ref(null)
    let chart = null

    const loading = ref(true)
    const error = ref(null)
    const fitData = ref(null)

    const token = computed(() => route.params.token)

    const initChart = () => {
      if (chartRef.value) {
        chart = echarts.init(chartRef.value)
      }
    }

    const updateChart = (observedData, fittedData) => {
      if (!chart || !observedData || !fittedData) return

      const time = observedData.map((_, i) => i)

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#444',
          textStyle: {
            color: '#fff'
          }
        },
        legend: {
          show: false
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: '数据点',
          nameTextStyle: {
            color: '#aaa'
          },
          axisLine: {
            lineStyle: {
              color: '#555'
            }
          },
          axisLabel: {
            color: '#aaa'
          }
        },
        yAxis: {
          type: 'value',
          name: '相对亮度',
          nameTextStyle: {
            color: '#aaa'
          },
          axisLine: {
            lineStyle: {
              color: '#555'
            }
          },
          axisLabel: {
            color: '#aaa'
          }
        },
        series: [
          {
            name: '观测数据',
            type: 'line',
            data: observedData,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: {
              width: 1,
              opacity: 0.6
            },
            itemStyle: {
              color: '#f39c12'
            }
          },
          {
            name: '拟合曲线',
            type: 'line',
            data: fittedData,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: '#e74c3c',
              type: 'dashed'
            }
          }
        ]
      }

      chart.setOption(option)
    }

    const loadData = async () => {
      if (!token.value) {
        error.value = '无效的分享链接'
        loading.value = false
        return
      }

      try {
        const response = await fitApi.getByToken(token.value)
        fitData.value = response.data
        updateChart(fitData.value.originalData, fitData.value.fitData)
      } catch (err) {
        console.error('Error loading fit data:', err)
        error.value = err.response?.data?.message || '加载数据失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    const goHome = () => {
      router.push('/')
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return 'N/A'
      }
    }

    const getAccuracyClass = (fitted, actual, tolerance) => {
      if (fitted == null || actual == null) return ''
      const diff = Math.abs(fitted - actual)
      if (diff <= tolerance) return 'accuracy-good'
      if (diff <= tolerance * 2) return 'accuracy-medium'
      return 'accuracy-poor'
    }

    const getAccuracyText = (fitted, actual, tolerance) => {
      if (fitted == null || actual == null) return ''
      const diff = Math.abs(fitted - actual)
      if (diff <= tolerance) return '✓ 非常准确'
      if (diff <= tolerance * 2) return '⚠ 比较接近'
      return '✗ 偏差较大'
    }

    const getMatchClass = (degree) => {
      if (degree == null) return ''
      if (degree >= 90) return 'match-excellent'
      if (degree >= 70) return 'match-good'
      if (degree >= 50) return 'match-medium'
      return 'match-poor'
    }

    onMounted(() => {
      initChart()
      loadData()

      window.addEventListener('resize', () => {
        chart?.resize()
      })
    })

    return {
      chartRef,
      loading,
      error,
      fitData,
      token,
      goHome,
      formatDate,
      getAccuracyClass,
      getAccuracyText,
      getMatchClass
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #aaa;
  font-size: 1.1em;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-container p {
  margin-top: 20px;
  color: #aaa;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.chart-card,
.stats-card,
.params-card,
.fit-params-card {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #fff;
}

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #aaa;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.observed {
  background: #f39c12;
}

.legend-dot.fitted {
  background: #e74c3c;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 5px;
}

.stat-value {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.params-card h3 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.param-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.param-label {
  color: #aaa;
}

.param-value {
  color: #fff;
  font-weight: 500;
}

.fit-param {
  text-align: center;
}

.fit-param-label {
  display: block;
  color: #667eea;
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 10px;
}

.fit-param-values {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.fitted-value {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
}

.true-value {
  color: #aaa;
  font-size: 14px;
}

.accuracy-good {
  color: #2ecc71;
}

.accuracy-medium {
  color: #f39c12;
}

.accuracy-poor {
  color: #e74c3c;
}

.match-excellent {
  color: #2ecc71;
}

.match-good {
  color: #3498db;
}

.match-medium {
  color: #f39c12;
}

.match-poor {
  color: #e74c3c;
}

.actions {
  text-align: center;
  margin-top: 30px;
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>