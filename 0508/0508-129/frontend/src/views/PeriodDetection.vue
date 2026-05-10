<template>
  <div class="period-detection-page">
    <el-card class="page-header-card">
      <div class="header-content">
        <h2>周期检测与光变曲线折叠</h2>
        <p>使用Lomb-Scargle周期图法自动检测变星周期，卷积平滑折叠光变曲线</p>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="input-card">
          <template #header>
            <div class="card-header">
              <span>数据输入</span>
              <el-tabs v-model="inputMode" size="small">
                <el-tab-pane label="选择变星" name="star" />
                <el-tab-pane label="上传数据" name="upload" />
              </el-tabs>
            </div>
          </template>

          <div v-if="inputMode === 'star'">
            <el-form label-width="100px">
              <el-form-item label="选择变星">
                <el-select
                  v-model="selectedStarId"
                  placeholder="请选择要分析的变星"
                  style="width: 100%"
                >
                  <el-option
                    v-for="star in starList"
                    :key="star.id"
                    :label="`${star.name} (${star.constellation})`"
                    :value="star.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div v-else>
            <el-upload
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :limit="1"
              accept=".csv,.txt,.dat"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持CSV格式，需包含：JD(儒略日), mag(星等), error(误差) 列
                </div>
              </template>
            </el-upload>
            <div v-if="uploadedFile" class="file-info">
              <el-tag type="success" size="small">已选择文件: {{ uploadedFile.name }}</el-tag>
            </div>
          </div>

          <el-divider />

          <div class="advanced-options">
            <el-collapse>
              <el-collapse-item title="高级选项" name="1">
                <el-form label-width="120px">
                  <el-form-item label="平滑方法">
                    <el-select v-model="smoothMethod" style="width: 100%">
                      <el-option label="Savitzky-Golay滤波" value="SAVITZKY_GOLAY" />
                      <el-option label="移动平均" value="MOVING_AVERAGE" />
                      <el-option label="加权移动平均" value="WEIGHTED_MOVING_AVERAGE" />
                      <el-option label="中值滤波" value="MEDIAN_FILTER" />
                      <el-option label="高斯平滑" value="GAUSSIAN" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="窗口大小">
                    <el-input-number
                      v-model="windowSize"
                      :min="3"
                      :max="15"
                      :step="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="相位分箱">
                    <el-input-number
                      v-model="phaseBins"
                      :min="20"
                      :max="100"
                      :step="10"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="自定义周期">
                    <el-switch v-model="useCustomPeriod" />
                  </el-form-item>
                  <el-form-item v-if="useCustomPeriod" label="周期(天)">
                    <el-input-number
                      v-model="customPeriod"
                      :min="0.01"
                      :max="1000"
                      :step="0.01"
                      :precision="4"
                      style="width: 100%"
                      placeholder="输入已知周期"
                    />
                  </el-form-item>
                </el-form>
              </el-collapse-item>
            </el-collapse>
          </div>

          <el-button
            type="primary"
            size="large"
            style="width: 100%; margin-top: 15px;"
            @click="runDetection"
            :loading="detecting"
            :disabled="!canRunDetection"
          >
            <el-icon><DataAnalysis /></el-icon>
            开始周期检测
          </el-button>

          <div v-if="detectionResult && !detectionResult.success" class="error-message">
            <el-alert :title="detectionResult.message" type="error" :closable="false" show-icon />
          </div>
        </el-card>

        <el-card v-if="detectionResult && detectionResult.success" class="result-card">
          <template #header>
            <div class="card-header">
              <span>检测结果</span>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="数据点数">
              <el-tag type="info">{{ detectionResult.dataPoints }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时间跨度">
              <el-tag type="info">{{ detectionResult.timeSpan.toFixed(2) }} 天</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最佳周期">
              <el-tag type="success" size="large">
                {{ detectionResult.bestPeriod.toFixed(4) }} 天
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="频谱功率">
              {{ detectionResult.bestPower.toFixed(4) }}
            </el-descriptions-item>
            <el-descriptions-item label="误报概率">
              <el-tag :type="detectionResult.significant ? 'success' : 'warning'">
                {{ (detectionResult.falseAlarmProbability * 100).toFixed(2) }}%
                <template v-if="detectionResult.significant"> (显著)</template>
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">候选周期</el-divider>

          <el-table :data="detectionResult.candidatePeriods" size="small" stripe>
            <el-table-column prop="rank" label="排名" width="70" align="center" />
            <el-table-column label="周期(天)" width="120">
              <template #default="{ row }">
                <span class="period-value">{{ row.period.toFixed(4) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="power" label="功率" width="100">
              <template #default="{ row }">
                {{ row.power.toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="periodType" label="类型" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="getCandidateTypeColor(row.periodType)">
                  {{ row.periodType }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-divider content-position="left">平滑参数</el-divider>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="平滑方法">
              {{ detectionResult.smoothedLightCurve?.method }}
            </el-descriptions-item>
            <el-descriptions-item label="RMS偏差">
              {{ detectionResult.smoothedLightCurve?.rms.toFixed(4) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card v-if="detectionResult && detectionResult.periodogramData" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>Lomb-Scargle 周期图</span>
              <el-tag v-if="detectionResult.bestPeriod" type="success" size="small">
                最佳周期: {{ detectionResult.bestPeriod.toFixed(4) }} 天
              </el-tag>
            </div>
          </template>
          <div ref="periodogramChartRef" class="chart-container"></div>
        </el-card>

        <el-card v-if="detectionResult && detectionResult.smoothedLightCurve" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>折叠光变曲线 (相位-星等图)</span>
              <el-tag type="info" size="small">
                {{ detectionResult.smoothedLightCurve?.method }}
              </el-tag>
            </div>
          </template>
          <div ref="foldedChartRef" class="chart-container"></div>
        </el-card>

        <el-card v-if="!detectionResult" class="empty-chart-card">
          <el-empty description="请选择数据并运行周期检测">
            <template #image>
              <el-icon :size="80" color="#909399"><DataAnalysis /></el-icon>
            </template>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showHelpDialog" title="CSV数据格式说明" width="600px">
      <div class="help-content">
        <h4>CSV文件格式要求</h4>
        <p>CSV文件应包含以下列（表头不区分大小写）：</p>
        <el-table :data="csvFormatExample" border size="small">
          <el-table-column prop="column" label="列名" width="120" />
          <el-table-column prop="required" label="必需" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.required" type="success" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">可选</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="example" label="示例" width="150" />
        </el-table>

        <h4 style="margin-top: 20px;">示例文件内容</h4>
        <pre class="example-csv">
JD,mag,error
2451545.5,12.34,0.15
2451546.5,12.56,0.12
2451547.5,12.45,0.13
2451548.5,12.28,0.14
2451549.5,12.61,0.15</pre>
      </div>
    </el-dialog>

    <el-button
      class="help-button"
      type="primary"
      circle
      @click="showHelpDialog = true"
    >
      <el-icon><QuestionFilled /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getStarList } from '@/api/stars'
import { uploadAndDetect, detectPeriod } from '@/api/periodDetection'

const inputMode = ref('star')
const starList = ref([])
const selectedStarId = ref(null)
const uploadedFile = ref(null)

const smoothMethod = ref('SAVITZKY_GOLAY')
const windowSize = ref(7)
const phaseBins = ref(50)
const useCustomPeriod = ref(false)
const customPeriod = ref(null)

const detecting = ref(false)
const detectionResult = ref(null)
const showHelpDialog = ref(false)

const periodogramChartRef = ref(null)
const foldedChartRef = ref(null)
let periodogramChart = null
let foldedChart = null

const csvFormatExample = [
  { column: 'JD / 儒略日', required: true, description: '儒略日 (Julian Date)', example: '2451545.5' },
  { column: 'mag / 星等', required: true, description: '观测星等值', example: '12.34' },
  { column: 'error / 误差', required: false, description: '星等误差', example: '0.15' },
  { column: 'time / 时间', required: false, description: '本地时间（未提供JD时使用）', example: '2024-01-15 20:30:00' }
]

const canRunDetection = computed(() => {
  if (inputMode.value === 'star') {
    return selectedStarId.value !== null
  } else {
    return uploadedFile.value !== null
  }
})

const getCandidateTypeColor = (type) => {
  switch (type) {
    case '主周期': return 'success'
    case '半周期谐波': return 'warning'
    case '倍周期谐波': return 'info'
    default: return 'primary'
  }
}

const loadStars = async () => {
  try {
    starList.value = await getStarList({})
  } catch (e) {
    console.error('加载变星列表失败')
  }
}

const handleFileChange = (file) => {
  uploadedFile.value = file.raw
}

const runDetection = async () => {
  detecting.value = true
  
  try {
    let result
    
    if (inputMode.value === 'star') {
      const requestData = {
        starId: selectedStarId.value,
        smoothMethod: smoothMethod.value,
        windowSize: windowSize.value,
        phaseBins: phaseBins.value,
        useCustomPeriod: useCustomPeriod.value,
        customPeriod: customPeriod.value
      }
      result = await detectPeriod(requestData)
    } else {
      const params = {
        smoothMethod: smoothMethod.value,
        windowSize: windowSize.value,
        phaseBins: phaseBins.value,
        useCustomPeriod: useCustomPeriod.value,
        customPeriod: customPeriod.value
      }
      result = await uploadAndDetect(uploadedFile.value, params)
    }
    
    detectionResult.value = result
    
    if (result.success) {
      ElMessage.success('周期检测完成')
      
      await nextTick()
      renderPeriodogramChart()
      renderFoldedChart()
    }
  } catch (e) {
    ElMessage.error('周期检测失败')
  } finally {
    detecting.value = false
  }
}

const renderPeriodogramChart = () => {
  if (!periodogramChartRef.value || !detectionResult.value?.periodogramData) return
  
  if (periodogramChart) {
    periodogramChart.dispose()
  }
  
  periodogramChart = echarts.init(periodogramChartRef.value)
  
  const data = detectionResult.value.periodogramData.map(p => [p.period, p.power])
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `周期: ${data.value[0].toFixed(4)} 天<br/>频率: ${(1/data.value[0]).toFixed(4)} 天⁻¹<br/>功率: ${data.value[1].toFixed(4)}`
      }
    },
    grid: {
      left: '8%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      name: '周期 (天)',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'log',
      min: 0.1,
      max: 1000,
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      name: '频谱功率',
      nameLocation: 'middle',
      nameGap: 40,
      type: 'value'
    },
    series: [{
      type: 'line',
      data: data,
      smooth: true,
      lineStyle: {
        width: 1.5,
        color: '#667eea'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
        ])
      },
      showSymbol: false
    }],
    graphic: detectionResult.value.bestPeriod ? [{
      type: 'line',
      z: 10,
      shape: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 1
      },
      left: (() => {
        const period = detectionResult.value.bestPeriod
        const minLog = Math.log10(0.1)
        const maxLog = Math.log10(1000)
        return ((Math.log10(period) - minLog) / (maxLog - minLog) * 100) + '%'
      })(),
      top: '10%',
      bottom: '15%',
      style: {
        stroke: '#f56c6c',
        lineWidth: 2,
        lineDash: [5, 5]
      }
    }] : []
  }
  
  periodogramChart.setOption(option)
}

const renderFoldedChart = () => {
  if (!foldedChartRef.value || !detectionResult.value?.smoothedLightCurve) return
  
  if (foldedChart) {
    foldedChart.dispose()
  }
  
  foldedChart = echarts.init(foldedChartRef.value)
  
  const smoothed = detectionResult.value.smoothedLightCurve
  const phases = smoothed.phases || []
  const magnitudes = smoothed.smoothedMagnitudes || []
  const originals = smoothed.originalMagnitudes || []
  
  const smoothData = phases.map((p, i) => [p, magnitudes[i]])
  const originalData = phases.map((p, i) => [p, originals[i]])
  
  const allMags = [...magnitudes, ...originals]
  const minMag = Math.min(...allMags) - 0.5
  const maxMag = Math.max(...allMags) + 0.5

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = ''
        params.forEach(p => {
          result += `${p.seriesName}<br/>相位: ${p.value[0].toFixed(3)}<br/>星等: ${p.value[1].toFixed(3)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['观测数据', '平滑曲线'],
      top: 10
    },
    grid: {
      left: '8%',
      right: '5%',
      top: '15%',
      bottom: '15%'
    },
    xAxis: {
      name: '相位 (Phase)',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      min: 0,
      max: 1.5
    },
    yAxis: {
      name: '星等 (V)',
      nameLocation: 'middle',
      nameGap: 40,
      type: 'value',
      min: Math.ceil(maxMag),
      max: Math.floor(minMag),
      inverse: false
    },
    series: [
      {
        name: '观测数据',
        type: 'scatter',
        data: originalData,
        symbolSize: 8,
        itemStyle: {
          color: '#409eff',
          opacity: 0.7
        }
      },
      {
        name: '平滑曲线',
        type: 'line',
        data: smoothData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#f56c6c'
        },
        showSymbol: false
      }
    ]
  }
  
  foldedChart.setOption(option)
}

const handleResize = () => {
  if (periodogramChart) periodogramChart.resize()
  if (foldedChart) foldedChart.resize()
}

onMounted(() => {
  loadStars()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (periodogramChart) periodogramChart.dispose()
  if (foldedChart) foldedChart.dispose()
})
</script>

<style scoped>
.period-detection-page {
  padding: 10px;
  position: relative;
}

.page-header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.input-card, .result-card, .chart-card, .empty-chart-card {
  margin-bottom: 20px;
}

.file-info {
  margin-top: 15px;
  text-align: center;
}

.advanced-options {
  margin-top: 10px;
}

.error-message {
  margin-top: 15px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.period-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}

.help-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.help-content h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.example-csv {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}
</style>
