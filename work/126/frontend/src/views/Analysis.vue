<template>
  <div class="analysis-page">
    <el-row :gutter="20" class="main-row">
      <el-col :span="5" class="left-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>弹孔标记</span>
              <el-badge :value="holes.length" :hidden="holes.length === 0" />
            </div>
          </template>
          
          <BulletHoleSelector
            :holes="holes"
            @remove="onRemoveHole"
            @update="onUpdateHole"
            @select="onSelectHole"
            @clear="onClearHoles"
          />
        </el-card>
      </el-col>

      <el-col :span="14" class="center-panel">
        <el-card shadow="never" class="viewer-card">
          <template #header>
            <div class="panel-header">
              <span>点云视图</span>
              <div class="header-controls" v-if="currentPointCloud">
                <el-select 
                  v-model="selectedLodLevel" 
                  size="small" 
                  placeholder="选择LOD层级"
                  @change="onLodLevelChange"
                  v-if="lodLevels.length > 0"
                  style="width: 180px; margin-right: 12px;"
                >
                  <el-option 
                    v-for="lod in lodLevels" 
                    :key="lod.lod_level"
                    :label="`LOD ${lod.lod_level} (${formatNumber(lod.point_count)} 点)`"
                    :value="lod.lod_level"
                  />
                </el-select>
                <el-tag size="small" type="info">
                  {{ currentPointCloud.file_name }}
                </el-tag>
              </div>
            </div>
          </template>

          <div class="viewer-wrapper">
            <PointCloudViewer
              :point-cloud-url="pointCloudUrl"
              :bullet-holes="holes"
              :trajectory-points="trajectoryData"
              :probability-cone="probabilityCone"
              :shooter-position="shooterPosition"
              :point-size="2"
              @point-click="onPointClick"
              @point-hover="onPointHover"
            />
          </div>

          <div class="analysis-result" v-if="hasAnalysisResult">
            <el-divider content-position="left">分析结果</el-divider>
            
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="估计射手位置">
                <span v-if="shooterPosition">
                  ({{ shooterPosition.x.toFixed(2) }}, 
                  {{ shooterPosition.y.toFixed(2) }}, 
                  {{ shooterPosition.z.toFixed(2) }})
                </span>
                <span v-else class="text-muted">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="弹道点数">
                {{ trajectoryData.length }}
              </el-descriptions-item>
              <el-descriptions-item label="使用空气密度">
                {{ calculatedAirDensity ? calculatedAirDensity.toFixed(4) : '标准值' }} kg/m³
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <el-col :span="5" class="right-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <span>武器参数</span>
          </template>
          
          <WeaponParamsPanel v-model="weaponParams" />
        </el-card>

        <el-card shadow="never" class="panel-card" style="margin-top: 16px">
          <template #header>
            <div class="panel-header">
              <span>环境参数</span>
              <el-tag v-if="calculatedAirDensity" type="success" size="small">
                {{ calculatedAirDensity.toFixed(3) }} kg/m³
              </el-tag>
            </div>
          </template>
          
          <el-form label-width="80px" size="small">
            <el-form-item label="温度">
              <el-input-number 
                v-model="environmentParams.temperature"
                :min="-50"
                :max="60"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
              <span class="unit">°C</span>
            </el-form-item>
            
            <el-form-item label="海拔">
              <el-input-number 
                v-model="environmentParams.altitude"
                :min="-500"
                :max="10000"
                :step="100"
                controls-position="right"
                style="width: 100%"
              />
              <span class="unit">m</span>
            </el-form-item>
            
            <el-form-item label="湿度">
              <el-slider 
                v-model="environmentParams.humidity"
                :min="0"
                :max="100"
                :step="1"
                show-input
              />
              <span class="unit">%</span>
            </el-form-item>
            
            <el-form-item label="大气压">
              <el-input-number 
                v-model="environmentParams.pressure"
                :min="80000"
                :max="110000"
                :step="100"
                :precision="0"
                controls-position="right"
                style="width: 100%"
                placeholder="自动计算"
              />
              <span class="unit">Pa</span>
            </el-form-item>
          </el-form>
          
          <el-alert 
            title="环境参数说明" 
            type="info" 
            :closable="false"
            show-icon
            class="env-alert"
          >
            <template #default>
              <div class="env-tips">
                <p><strong>温度/海拔：</strong>影响空气密度计算</p>
                <p><strong>湿度：</strong>湿度越高，空气密度越低</p>
                <p><strong>标准值：</strong>20°C, 0m, 50% RH → 1.205 kg/m³</p>
              </div>
            </template>
          </el-alert>
          
          <el-button 
            type="primary" 
            size="small"
            @click="calculateAirDensity"
            :loading="calculatingDensity"
            style="width: 100%; margin-top: 12px;"
          >
            预览空气密度
          </el-button>
        </el-card>

        <el-card shadow="never" class="panel-card" style="margin-top: 16px" v-if="currentPointCloud">
          <template #header>
            <div class="panel-header">
              <span>自动检测弹孔</span>
              <el-tag type="warning" size="small">优化算法</el-tag>
            </div>
          </template>
          
          <p class="auto-detect-tip">
            使用优化的法线突变检测算法，降低误报率
          </p>
          
          <el-slider
            v-model="detectThreshold"
            :min="0.1"
            :max="0.8"
            :step="0.05"
            :show-tooltip="true"
            :format-tooltip="formatThresholdTooltip"
            style="margin: 16px 0"
          />
          
          <div class="detect-options">
            <el-checkbox v-model="useOptimizedDetection">使用优化算法</el-checkbox>
          </div>
          
          <el-button 
            type="warning" 
            :loading="detecting"
            @click="autoDetectHoles"
            style="width: 100%"
            :icon="Search"
          >
            开始检测
          </el-button>

          <div v-if="detectedCandidates.length > 0" class="candidates-list">
            <el-divider content-position="left">检测结果</el-divider>
            <el-checkbox-group v-model="selectedCandidates">
              <div 
                v-for="(candidate, index) in detectedCandidates" 
                :key="index"
                class="candidate-item"
              >
                <el-checkbox :value="index" :label="index">
                  候选点 {{ index + 1 }}
                </el-checkbox>
                <el-tag 
                  size="small"
                  :type="candidate.confidence > 0.7 ? 'success' : candidate.confidence > 0.4 ? 'warning' : 'info'"
                >
                  {{ (candidate.confidence * 100).toFixed(0) }}%
                </el-tag>
              </div>
            </el-checkbox-group>
            
            <el-button 
              type="primary" 
              size="small"
              :disabled="selectedCandidates.length === 0"
              @click="addSelectedCandidates"
              style="margin-top: 12px"
            >
              添加选中的候选点
            </el-button>
          </div>
        </el-card>

        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!canAnalyze"
            :loading="analyzing"
            @click="runAnalysis"
            style="width: 100%"
            :icon="DataAnalysis"
          >
            执行弹道分析
          </el-button>
          
          <el-button 
            type="success" 
            size="large" 
            :disabled="!hasAnalysisResult"
            :loading="generatingReport"
            @click="generateReport"
            style="width: 100%; margin-top: 12px"
            :icon="Document"
          >
            生成案件报告
          </el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, Document, Search } from '@element-plus/icons-vue'
import { pointCloudApi, ballisticApi, reportApi } from '@/api'
import { useAnalysisStore } from '@/stores/analysis'
import PointCloudViewer from '@/components/PointCloudViewer.vue'
import BulletHoleSelector from '@/components/BulletHoleSelector.vue'
import WeaponParamsPanel from '@/components/WeaponParamsPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useAnalysisStore()

const currentPointCloud = ref(null)
const pointCloudUrl = ref('')
const analyzing = ref(false)
const generatingReport = ref(false)
const detecting = ref(false)
const calculateDensity = ref(false)
const detectThreshold = ref(0.3)
const detectedCandidates = ref([])
const selectedCandidates = ref([])
const useOptimizedDetection = ref(true)
const calculatingDensity = ref(false)

const lodLevels = computed(() => store.lodLevels)
const selectedLodLevel = ref(0)
const calculatedAirDensity = computed(() => store.calculatedAirDensity)

const holes = computed(() => store.selectedBulletHoles)
const weaponParams = computed({
  get: () => store.weaponParams,
  set: (val) => store.setWeaponParams(val)
})
const environmentParams = computed({
  get: () => store.environmentParams,
  set: (val) => store.setEnvironmentParams(val)
})
const trajectoryData = computed(() => store.trajectoryData)
const probabilityCone = computed(() => store.probabilityCone)
const shooterPosition = computed(() => store.shooterPosition)
const hasAnalysisResult = computed(() => store.currentAnalysis !== null)

const canAnalyze = computed(() => {
  return holes.value.length >= 2 && currentPointCloud.value !== null
})

const formatThresholdTooltip = (value) => `阈值: ${value}`

const formatNumber = (num) => {
  if (!num) return '-'
  return num.toLocaleString()
}

const onPointClick = (point) => {
  store.addBulletHole({
    position: point.position,
    normal: point.normal,
    hole_type: 'uncertain',
    confidence: 1.0,
    is_manual: true
  })
  ElMessage.success(`已添加弹孔标记 #${holes.value.length}`)
}

const onPointHover = (point) => {
}

const onRemoveHole = (index) => {
  store.removeBulletHole(index)
}

const onUpdateHole = ({ index, updates }) => {
  store.updateBulletHole(index, updates)
}

const onSelectHole = (index) => {
}

const onClearHoles = () => {
  ElMessageBox.confirm('确定要清除所有弹孔标记吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.clearBulletHoles()
    store.clearAnalysis()
  }).catch(() => {})
}

const onLodLevelChange = async (level) => {
  if (!currentPointCloud.value) return
  
  try {
    const response = await pointCloudApi.downloadLod(currentPointCloud.value.id, level)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    pointCloudUrl.value = url
    store.setCurrentLodLevel(level)
  } catch (error) {
    console.error('LOD load error:', error)
    ElMessage.error('无法加载LOD层级')
  }
}

const calculateAirDensity = async () => {
  calculatingDensity.value = true
  try {
    const response = await ballisticApi.calculateAirDensity({
      temperature: environmentParams.value.temperature,
      altitude: environmentParams.value.altitude,
      humidity: environmentParams.value.humidity,
      pressure: environmentParams.value.pressure
    })
    
    store.setCalculatedAirDensity(response.data.air_density)
    
    const densityRatio = response.data.density_ratio
    let densityMessage = `计算空气密度: ${response.data.air_density.toFixed(4)} kg/m³`
    
    if (densityRatio < 0.9) {
      densityMessage += ` (比标准稀薄 ${((1 - densityRatio) * 100).toFixed(1)}%)`
    } else if (densityRatio > 1.1) {
      densityMessage += ` (比标准稠密 ${((densityRatio - 1) * 100).toFixed(1)}%)`
    }
    
    ElMessage.info(densityMessage)
  } catch (error) {
    console.error('Density calculate error:', error)
    ElMessage.error(error.response?.data?.detail || '计算失败')
  } finally {
    calculatingDensity.value = false
  }
}

const runAnalysis = async () => {
  if (!canAnalyze.value) return
  
  analyzing.value = true
  try {
    const request = {
      point_cloud_id: currentPointCloud.value.id,
      bullet_holes: holes.value.map(h => ({
        position: h.position,
        normal: h.normal,
        hole_type: h.hole_type,
        confidence: h.confidence,
        is_manual: h.is_manual
      })),
      weapon_params: {
        weapon_type: weaponParams.value.weapon_type,
        initial_velocity_min: weaponParams.value.initial_velocity_min,
        initial_velocity_max: weaponParams.value.initial_velocity_max,
        bullet_mass: weaponParams.value.bullet_mass,
        drag_coefficient: weaponParams.value.drag_coefficient,
        bullet_diameter: weaponParams.value.bullet_diameter
      },
      environment_params: {
        temperature: environmentParams.value.temperature,
        altitude: environmentParams.value.altitude,
        humidity: environmentParams.value.humidity,
        pressure: environmentParams.value.pressure
      }
    }
    
    const response = await ballisticApi.analyze(request)
    store.setAnalysisResult(response.data)
    
    if (response.data.environment_params) {
      store.setCalculatedAirDensity(response.data.air_density_used)
    }
    
    ElMessage.success('弹道分析完成')
  } catch (error) {
    console.error('Analysis error:', error)
    ElMessage.error(error.response?.data?.detail || '分析失败')
  } finally {
    analyzing.value = false
  }
}

const generateReport = async () => {
  if (!hasAnalysisResult.value) return
  
  generatingReport.value = true
  try {
    const response = await reportApi.generate({
      analysis_id: store.currentAnalysis.id,
      include_point_cloud_info: true,
      include_trajectory: true,
      include_probability_cone: true
    })
    
    ElMessage.success('报告生成成功')
    
    const downloadResponse = await reportApi.download(response.data.id)
    const url = window.URL.createObjectURL(new Blob([downloadResponse.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ballistic_report_${store.currentAnalysis.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Report error:', error)
    ElMessage.error(error.response?.data?.detail || '报告生成失败')
  } finally {
    generatingReport.value = false
  }
}

const autoDetectHoles = async () => {
  if (!currentPointCloud.value) return
  
  detecting.value = true
  try {
    const response = await pointCloudApi.detectHoles(
      currentPointCloud.value.id,
      detectThreshold.value,
      useOptimizedDetection.value
    )
    detectedCandidates.value = response.data.candidates || []
    selectedCandidates.value = []
    
    const algorithmUsed = response.data.algorithm || (useOptimizedDetection.value ? 'optimized' : 'original')
    ElMessage.success(`检测到 ${detectedCandidates.value.length} 个候选点 (${algorithmUsed} 算法)`)
  } catch (error) {
    console.error('Detect error:', error)
    ElMessage.error(error.response?.data?.detail || '检测失败')
  } finally {
    detecting.value = false
  }
}

const addSelectedCandidates = () => {
  selectedCandidates.value.forEach(index => {
    const candidate = detectedCandidates.value[index]
    if (candidate) {
      store.addBulletHole({
        position: candidate.position,
        normal: candidate.normal,
        hole_type: 'uncertain',
        confidence: candidate.confidence,
        is_manual: false
      })
    }
  })
  ElMessage.success(`已添加 ${selectedCandidates.value.length} 个候选点`)
  selectedCandidates.value = []
}

const loadPointCloud = async (id) => {
  try {
    const response = await pointCloudApi.getInfo(id)
    currentPointCloud.value = response.data
    pointCloudUrl.value = `/api/pointcloud/${id}/download`
    store.setPointCloud(response.data)
    
    try {
      const lodResponse = await pointCloudApi.getLodLevels(id)
      if (lodResponse.data.lod_levels && lodResponse.data.lod_levels.length > 0) {
        store.setLodLevels(lodResponse.data.lod_levels)
        
        const optimalLod = lodResponse.data.lod_levels.find(l => l.point_count <= 500000)
        if (optimalLod) {
          selectedLodLevel.value = optimalLod.lod_level
        } else {
          selectedLodLevel.value = lodResponse.data.lod_levels[0].lod_level
        }
      }
    } catch (lodError) {
      console.log('No LOD data available:', lodError)
    }
    
  } catch (error) {
    console.error('Load error:', error)
    ElMessage.error('无法加载点云数据')
  }
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    loadPointCloud(id)
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    loadPointCloud(newId)
  }
})
</script>

<style scoped>
.analysis-page {
  height: 100%;
}

.main-row {
  height: 100%;
}

.left-panel,
.right-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.center-panel {
  height: 100%;
}

.panel-card {
  flex: 0 0 auto;
}

.header-controls {
  display: flex;
  align-items: center;
}

.unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.env-alert {
  margin-top: 12px;
}

.env-tips {
  font-size: 11px;
  line-height: 1.6;
}

.env-tips p {
  margin: 2px 0;
}

.detect-options {
  margin-bottom: 12px;
  font-size: 12px;
}

.action-buttons {
  margin-top: 16px;
  padding: 0 4px;
  margin-bottom: 16px;
}

.viewer-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewer-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.viewer-wrapper {
  flex: 1;
  min-height: 400px;
}

.analysis-result {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auto-detect-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.candidates-list {
  margin-top: 16px;
}

.candidate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.text-muted {
  color: #909399;
}
</style>
