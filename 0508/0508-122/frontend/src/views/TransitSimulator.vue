<template>
  <div class="container">
    <header class="header">
      <h1>🌌 系外行星凌星光变曲线模拟器</h1>
      <p class="subtitle">探索系外行星的神秘世界</p>
      <div class="nav-links">
        <router-link to="/prediction" class="nav-link">
          <span>🔮 凌星参数预测</span>
        </router-link>
      </div>
    </header>

    <div class="main-content">
      <div class="left-panel">
        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🌟 恒星参数</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="恒星模板">
              <el-select v-model="selectedStarTemplate" placeholder="选择恒星模板" @change="applyStarTemplate">
                <el-option
                  v-for="star in starTemplates"
                  :key="star.id"
                  :label="star.name"
                  :value="star"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="恒星半径 (太阳半径)">
              <el-input-number
                v-model="starParams.radius"
                :min="0.01"
                :max="1000"
                :step="0.01"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="恒星温度 (K)">
              <el-input-number
                v-model="starParams.temperature"
                :min="2000"
                :max="50000"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🪐 行星参数</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="行星半径 (地球半径)">
              <el-slider
                v-model="planetParams.radius"
                :min="0.1"
                :max="20"
                :step="0.1"
                :format-tooltip="val => val + ' R⊕'"
              />
              <div class="slider-value">{{ planetParams.radius }} R⊕</div>
            </el-form-item>

            <el-form-item label="轨道周期 (天)">
              <el-slider
                v-model="planetParams.period"
                :min="0.5"
                :max="100"
                :step="0.5"
                :format-tooltip="val => val + ' 天'"
              />
              <div class="slider-value">{{ planetParams.period }} 天</div>
            </el-form-item>

            <el-form-item label="轨道倾角 (度)">
              <el-slider
                v-model="planetParams.inclination"
                :min="0"
                :max="90"
                :step="0.5"
                :format-tooltip="val => val + '°'"
              />
              <div class="slider-value">{{ planetParams.inclination }}°</div>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📊 模拟设置</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="高斯噪声水平">
              <el-slider
                v-model="noiseLevel"
                :min="0"
                :max="1"
                :step="0.01"
                :format-tooltip="val => (val * 100).toFixed(0) + '%'"
              />
              <div class="slider-value">{{ (noiseLevel * 100).toFixed(0) }}%</div>
            </el-form-item>

            <el-form-item label="数据点数量">
              <el-input-number
                v-model="numPoints"
                :min="100"
                :max="5000"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="显示周期数">
              <el-input-number
                v-model="numPeriods"
                :min="1"
                :max="5"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>

          <el-button type="primary" @click="generateTransit" :loading="loading" style="width: 100%">
            生成光变曲线
          </el-button>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📈 光变曲线</span>
              <div class="chart-legend">
                <span class="legend-item">
                  <span class="legend-dot noise"></span>
                  含噪声数据
                </span>
                <span class="legend-item">
                  <span class="legend-dot clean"></span>
                  理论曲线
                </span>
              </div>
            </div>
          </template>
          
          <div ref="chartRef" class="chart-container"></div>
          
          <div v-if="simulationResult" class="simulation-info">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">凌星深度</span>
                  <span class="info-value">{{ (simulationResult.transitDepth * 100).toFixed(4) }}%</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">凌星时长</span>
                  <span class="info-value">{{ simulationResult.transitDuration.toFixed(2) }} 小时</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">恒星类型</span>
                  <span class="info-value">{{ simulationResult.starType }}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <el-card v-if="simulationResult" class="fit-card">
          <template #header>
            <div class="card-header">
              <span>🔬 参数拟合</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="拟合行星半径 (地球半径)">
                  <el-slider
                    v-model="fitParams.radius"
                    :min="0.1"
                    :max="20"
                    :step="0.1"
                    :format-tooltip="val => val + ' R⊕'"
                  />
                  <div class="slider-value">
                    {{ fitParams.radius }} R⊕
                    <span v-if="fitResult" :class="getAccuracyClass(fitParams.radius, planetParams.radius, 0.5)">
                      (真实值: {{ planetParams.radius }} R⊕)
                    </span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="拟合轨道倾角 (度)">
                  <el-slider
                    v-model="fitParams.inclination"
                    :min="0"
                    :max="90"
                    :step="0.5"
                    :format-tooltip="val => val + '°'"
                  />
                  <div class="slider-value">
                    {{ fitParams.inclination }}°
                    <span v-if="fitResult" :class="getAccuracyClass(fitParams.inclination, planetParams.inclination, 1)">
                      (真实值: {{ planetParams.inclination }}°)
                    </span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-button type="success" @click="calculateFit" :loading="fitting" style="width: 100%">
            计算拟合
          </el-button>

          <div v-if="fitResult" class="fit-results">
            <el-divider>拟合结果</el-divider>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="fit-stat">
                  <span class="fit-label">χ²</span>
                  <span class="fit-value">{{ fitResult.chiSquared.toFixed(4) }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="fit-stat">
                  <span class="fit-label">约化χ²</span>
                  <span class="fit-value">{{ fitResult.reducedChiSquared.toFixed(6) }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="fit-stat">
                  <span class="fit-label">匹配度</span>
                  <span class="fit-value" :class="getMatchClass(fitResult.matchingDegree)">
                    {{ fitResult.matchingDegree.toFixed(2) }}%
                  </span>
                </div>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="saveAndShare" :loading="saving">
                  📤 保存并分享
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="shareDialogVisible"
      title="分享拟合结果"
      width="500px"
    >
      <div class="share-content">
        <p>您的拟合结果已保存！分享链接：</p>
        <el-input
          :value="shareUrl"
          readonly
          @focus="selectShareUrl"
          ref="shareInput"
        />
        <el-button type="primary" @click="copyShareUrl" style="margin-top: 10px; width: 100%">
          复制链接
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { transitApi, fitApi, starApi } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'TransitSimulator',
  setup() {
    const chartRef = ref(null)
    const shareInput = ref(null)
    let chart = null

    const loading = ref(false)
    const fitting = ref(false)
    const saving = ref(false)
    const shareDialogVisible = ref(false)
    const shareUrl = ref('')

    const starTemplates = ref([])
    const selectedStarTemplate = ref(null)

    const starParams = ref({
      radius: 1.0,
      temperature: 5778
    })

    const planetParams = ref({
      radius: 1.0,
      period: 10,
      inclination: 85
    })

    const fitParams = ref({
      radius: 1.0,
      inclination: 85
    })

    const noiseLevel = ref(0.1)
    const numPoints = ref(1000)
    const numPeriods = ref(3)

    const simulationResult = ref(null)
    const fitResult = ref(null)

    const applyStarTemplate = (star) => {
      starParams.value.radius = star.radius
      starParams.value.temperature = star.temperature
    }

    const initChart = () => {
      if (chartRef.value) {
        chart = echarts.init(chartRef.value)
        updateChart([])
      }
    }

    const updateChart = (time, noiseData = [], cleanData = [], fitData = []) => {
      if (!chart) return

      const series = []

      if (noiseData.length > 0) {
        series.push({
          name: '含噪声数据',
          type: 'line',
          data: time.map((t, i) => [t, noiseData[i]]),
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 1,
            opacity: 0.6
          },
          itemStyle: {
            color: '#f39c12'
          }
        })
      }

      if (cleanData.length > 0) {
        series.push({
          name: '理论曲线',
          type: 'line',
          data: time.map((t, i) => [t, cleanData[i]]),
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: '#3498db'
          }
        })
      }

      if (fitData.length > 0) {
        series.push({
          name: '拟合曲线',
          type: 'line',
          data: time.map((t, i) => [t, fitData[i]]),
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: '#e74c3c',
            type: 'dashed'
          }
        })
      }

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
          name: '时间 (小时)',
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
        series: series
      }

      chart.setOption(option)
    }

    const generateTransit = async () => {
      loading.value = true
      try {
        const response = await transitApi.simulate({
          starRadius: starParams.value.radius,
          starTemperature: starParams.value.temperature,
          planetRadius: planetParams.value.radius,
          orbitalPeriod: planetParams.value.period,
          inclination: planetParams.value.inclination,
          noiseLevel: noiseLevel.value,
          numPoints: numPoints.value,
          numPeriods: numPeriods.value
        })

        simulationResult.value = response.data
        fitResult.value = null
        fitParams.value.radius = planetParams.value.radius
        fitParams.value.inclination = planetParams.value.inclination

        updateChart(
          simulationResult.value.time,
          simulationResult.value.fluxWithNoise,
          simulationResult.value.flux
        )

        ElMessage.success('光变曲线生成成功！')
      } catch (error) {
        console.error('Error generating transit:', error)
        ElMessage.error('生成光变曲线失败，请检查参数')
      } finally {
        loading.value = false
      }
    }

    const calculateFit = async () => {
      if (!simulationResult.value) {
        ElMessage.warning('请先生成光变曲线')
        return
      }

      fitting.value = true
      try {
        const response = await fitApi.calculate({
          observedData: simulationResult.value.fluxWithNoise,
          starRadius: starParams.value.radius,
          starTemperature: starParams.value.temperature,
          orbitalPeriod: planetParams.value.period,
          fittedPlanetRadius: fitParams.value.radius,
          fittedInclination: fitParams.value.inclination,
          originalPlanetRadius: planetParams.value.radius,
          originalInclination: planetParams.value.inclination,
          noiseLevel: noiseLevel.value,
          numPoints: numPoints.value,
          numPeriods: numPeriods.value
        })

        fitResult.value = response.data

        updateChart(
          fitResult.value.time,
          fitResult.value.observedFlux,
          simulationResult.value.flux,
          fitResult.value.fittedFlux
        )

        ElMessage.success('拟合计算完成！')
      } catch (error) {
        console.error('Error calculating fit:', error)
        ElMessage.error('拟合计算失败')
      } finally {
        fitting.value = false
      }
    }

    const saveAndShare = async () => {
      if (!fitResult.value) return

      saving.value = true
      try {
        const response = await fitApi.save({
          observedData: simulationResult.value.fluxWithNoise,
          starRadius: starParams.value.radius,
          starTemperature: starParams.value.temperature,
          orbitalPeriod: planetParams.value.period,
          fittedPlanetRadius: fitParams.value.radius,
          fittedInclination: fitParams.value.inclination,
          originalPlanetRadius: planetParams.value.radius,
          originalInclination: planetParams.value.inclination,
          noiseLevel: noiseLevel.value,
          numPoints: numPoints.value,
          numPeriods: numPeriods.value
        })

        shareUrl.value = `${window.location.origin}/#/share/${response.data.shareToken}`
        shareDialogVisible.value = true
        ElMessage.success('结果已保存！')
      } catch (error) {
        console.error('Error saving fit:', error)
        ElMessage.error('保存失败')
      } finally {
        saving.value = false
      }
    }

    const selectShareUrl = () => {
      if (shareInput.value) {
        nextTick(() => {
          shareInput.value.select()
        })
      }
    }

    const copyShareUrl = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl.value)
        ElMessage.success('链接已复制到剪贴板！')
      } catch {
        ElMessage.warning('复制失败，请手动复制')
      }
    }

    const getAccuracyClass = (fitted, actual, tolerance) => {
      const diff = Math.abs(fitted - actual)
      if (diff <= tolerance) return 'accuracy-good'
      if (diff <= tolerance * 2) return 'accuracy-medium'
      return 'accuracy-poor'
    }

    const getMatchClass = (degree) => {
      if (degree >= 90) return 'match-excellent'
      if (degree >= 70) return 'match-good'
      if (degree >= 50) return 'match-medium'
      return 'match-poor'
    }

    watch([
      () => fitParams.value.radius,
      () => fitParams.value.inclination
    ], () => {
      if (fitResult.value) {
        calculateFit()
      }
    }, { deep: true })

    onMounted(async () => {
      initChart()

      try {
        const response = await starApi.getAllTemplates()
        starTemplates.value = response.data
      } catch (error) {
        console.error('Error loading star templates:', error)
      }

      window.addEventListener('resize', () => {
        chart?.resize()
      })
    })

    return {
      chartRef,
      shareInput,
      loading,
      fitting,
      saving,
      shareDialogVisible,
      shareUrl,
      starTemplates,
      selectedStarTemplate,
      starParams,
      planetParams,
      fitParams,
      noiseLevel,
      numPoints,
      numPeriods,
      simulationResult,
      fitResult,
      applyStarTemplate,
      generateTransit,
      calculateFit,
      saveAndShare,
      selectShareUrl,
      copyShareUrl,
      getAccuracyClass,
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

.nav-links {
  margin-top: 15px;
}

.nav-link {
  display: inline-block;
  color: #667eea;
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.3s;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.2);
}

.main-content {
  display: flex;
  gap: 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.left-panel {
  width: 400px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.panel-card,
.chart-card,
.fit-card {
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

.legend-dot.noise {
  background: #f39c12;
}

.legend-dot.clean {
  background: #3498db;
}

.slider-value {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  margin-top: 5px;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.simulation-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 5px;
}

.info-value {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.fit-results {
  margin-top: 20px;
}

.fit-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fit-label {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 5px;
}

.fit-value {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
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

.share-content {
  text-align: center;
}

.share-content p {
  margin-bottom: 15px;
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-slider__button) {
  border-color: #667eea;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
}

:deep(.el-input__inner) {
  color: #fff !important;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
}

:deep(.el-form-item__label) {
  color: #aaa !important;
}

:deep(.el-divider__text) {
  background: transparent !important;
  color: #aaa !important;
}
</style>