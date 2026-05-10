<template>
  <div class="main-content">
    <ParamPanel @calculate="handleCalculate" />
    
    <div class="preview-area">
      <div class="preview-header">
        <div class="info">
          <span>当前榫卯: <strong>{{ currentTypeName }}</strong></span>
          <span style="margin-left: 20px;">
            木料: {{ woodParams.length }} × {{ woodParams.width }} × {{ woodParams.height }} mm
          </span>
        </div>
        <div class="toolbar">
          <el-button 
            :type="showStress ? 'danger' : 'info'" 
            @click="toggleStressSimulation"
            :loading="simulating"
          >
            <el-icon><TrendCharts /></el-icon>
            {{ showStress ? '关闭应力' : '应力模拟' }}
          </el-button>
          <el-button type="primary" @click="showSaveDialog = true">
            <el-icon><Star /></el-icon>
            收藏参数
          </el-button>
          <el-button type="success" @click="exportStl" :loading="exportingStl">
            <el-icon><Download /></el-icon>
            导出 STL
          </el-button>
          <el-button type="warning" @click="exportPdf" :loading="exportingPdf">
            <el-icon><Document /></el-icon>
            导出 PDF
          </el-button>
        </div>
      </div>
      
      <div class="stress-control-bar" v-if="showStress">
        <div class="stress-controls">
          <div class="control-group">
            <span class="control-label">载荷:</span>
            <el-input-number 
              v-model="stressForm.loadForce" 
              :min="10" 
              :max="10000" 
              :step="100"
              size="small"
              @change="runStressSimulation"
            />
            <span class="control-unit">N</span>
          </div>
          <div class="control-group">
            <span class="control-label">方向:</span>
            <el-select 
              v-model="stressForm.loadDirection" 
              size="small"
              style="width: 120px"
              @change="runStressSimulation"
            >
              <el-option 
                v-for="dir in loadDirections" 
                :key="dir.code" 
                :label="dir.name" 
                :value="dir.code"
              />
            </el-select>
          </div>
          <div class="control-group">
            <span class="control-label">运行:</span>
            <el-button type="primary" size="small" @click="runStressSimulation" :loading="simulating">
              计算
            </el-button>
          </div>
        </div>
        
        <div class="stress-legend">
          <div class="legend-title">应力分布 (伪彩色)</div>
          <div class="legend-bar">
            <div class="legend-color low"></div>
            <div class="legend-color mid-low"></div>
            <div class="legend-color mid"></div>
            <div class="legend-color mid-high"></div>
            <div class="legend-color high"></div>
          </div>
          <div class="legend-labels">
            <span>低</span>
            <span>中</span>
            <span>高</span>
          </div>
        </div>
      </div>
      
      <div class="stress-info-panel" v-if="showStress && stressResult">
        <div class="info-row">
          <span class="info-label">最大应力:</span>
          <span class="info-value" :class="getRiskClass(stressResult.riskLevel)">
            {{ stressResult.maxStress?.toFixed(2) }} MPa
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">安全系数:</span>
          <span class="info-value" :class="getSafetyClass(stressResult.safetyFactor)">
            {{ stressResult.safetyFactor?.toFixed(2) }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">风险等级:</span>
          <el-tag :type="getRiskTagType(stressResult.riskLevel)" size="small">
            {{ getRiskName(stressResult.riskLevel) }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">危险区域:</span>
          <span class="info-value">{{ stressResult.criticalRegion }}</span>
        </div>
      </div>
      
      <div class="preview-canvas" :class="{ 'with-stress-panel': showStress }">
        <div v-if="isCalculating || simulating" class="loading-overlay">
          <el-loading :text="simulating ? '应力分析中...' : '计算中...'" />
        </div>
        <ThreePreview 
          :params="previewParams" 
          :result="calculationResult"
          :stress-result="stressResult"
          :show-stress="showStress"
        />
      </div>
      
      <div class="preview-footer">
        <div class="tips">
          <span>🖱️ 左键拖拽: 旋转视角</span>
          <span>🖱️ 右键拖拽: 平移视角</span>
          <span>🖱️ 滚轮: 缩放</span>
        </div>
        <div>
          榫头: {{ tenonParams.length }} × {{ tenonParams.width }} × {{ tenonParams.height }} mm
        </div>
      </div>
    </div>
    
    <el-dialog 
      v-model="showSaveDialog" 
      title="收藏当前参数" 
      width="400px"
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="saveForm.name" placeholder="请输入收藏名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="saveForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="可选：添加备注说明"
            maxlength="500"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFavorite" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useJoinStore } from '@/stores/join'
import { storeToRefs } from 'pinia'
import { calculateJoin, exportStl as apiExportStl, exportPdf as apiExportPdf } from '@/api/join'
import { getJoinTypes } from '@/api/join'
import { getLoadDirections, simulateStress } from '@/api/stress'
import ParamPanel from '@/components/ParamPanel.vue'
import ThreePreview from '@/components/ThreePreview.vue'
import { ElMessage } from 'element-plus'

const store = useJoinStore()
const { 
  currentType, 
  woodParams, 
  tenonParams, 
  margin,
  calculationResult,
  currentParams
} = storeToRefs(store)

const joinTypes = ref([])
const loadDirections = ref([])
const isCalculating = ref(false)
const exportingStl = ref(false)
const exportingPdf = ref(false)
const saving = ref(false)
const showSaveDialog = ref(false)
const saveForm = ref({
  name: '',
  description: ''
})

const showStress = ref(false)
const simulating = ref(false)
const stressResult = ref(null)
const stressForm = ref({
  loadForce: 1000,
  loadDirection: 'TENSION'
})

const currentTypeName = computed(() => {
  const type = joinTypes.value.find(t => t.code === currentType.value)
  return type?.name || currentType.value
})

const previewParams = computed(() => ({
  joinType: currentType.value,
  woodLength: woodParams.value.length,
  woodWidth: woodParams.value.width,
  woodHeight: woodParams.value.height,
  tenonLength: tenonParams.value.length,
  tenonWidth: tenonParams.value.width,
  tenonHeight: tenonParams.value.height,
  margin: margin.value
}))

const handleCalculate = async (params) => {
  isCalculating.value = true
  try {
    const result = await calculateJoin(params)
    store.setCalculationResult(result)
    
    if (showStress.value) {
      await runStressSimulation()
    }
  } catch (e) {
    console.error('计算失败:', e)
    ElMessage.error('计算失败，请检查参数')
  } finally {
    isCalculating.value = false
  }
}

const toggleStressSimulation = async () => {
  showStress.value = !showStress.value
  if (showStress.value) {
    if (!stressResult.value) {
      await runStressSimulation()
    }
  }
}

const runStressSimulation = async () => {
  simulating.value = true
  try {
    const result = await simulateStress({
      joinType: currentType.value,
      woodLength: woodParams.value.length,
      woodWidth: woodParams.value.width,
      woodHeight: woodParams.value.height,
      tenonLength: tenonParams.value.length,
      tenonWidth: tenonParams.value.width,
      tenonHeight: tenonParams.value.height,
      margin: margin.value,
      loadForce: stressForm.value.loadForce,
      loadDirection: stressForm.value.loadDirection
    })
    stressResult.value = result
    
    if (result.riskLevel === 'HIGH') {
      ElMessage.warning('警告：应力集中风险较高，请考虑调整设计')
    }
  } catch (e) {
    console.error('应力模拟失败:', e)
    ElMessage.error('应力模拟失败')
  } finally {
    simulating.value = false
  }
}

const getRiskClass = (riskLevel) => {
  switch (riskLevel) {
    case 'HIGH': return 'risk-high'
    case 'MEDIUM': return 'risk-medium'
    default: return 'risk-low'
  }
}

const getSafetyClass = (factor) => {
  if (factor > 3.0) return 'risk-low'
  if (factor > 1.5) return 'risk-medium'
  return 'risk-high'
}

const getRiskTagType = (riskLevel) => {
  switch (riskLevel) {
    case 'HIGH': return 'danger'
    case 'MEDIUM': return 'warning'
    default: return 'success'
  }
}

const getRiskName = (riskLevel) => {
  switch (riskLevel) {
    case 'HIGH': return '高风险'
    case 'MEDIUM': return '中等'
    default: return '安全'
  }
}

const exportStl = async () => {
  exportingStl.value = true
  try {
    const blob = await apiExportStl(currentParams.value)
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `榫卯_${currentTypeName.value}_${Date.now()}.stl`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('STL导出成功')
  } catch (e) {
    console.error('导出STL失败:', e)
    ElMessage.error('导出STL失败')
  } finally {
    exportingStl.value = false
  }
}

const exportPdf = async () => {
  exportingPdf.value = true
  try {
    const blob = await apiExportPdf(currentParams.value)
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `榫卯_${currentTypeName.value}_${Date.now()}.pdf`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('PDF导出成功')
  } catch (e) {
    console.error('导出PDF失败:', e)
    ElMessage.error('导出PDF失败')
  } finally {
    exportingPdf.value = false
  }
}

const saveFavorite = async () => {
  if (!saveForm.value.name.trim()) {
    ElMessage.warning('请输入收藏名称')
    return
  }
  saving.value = true
  try {
    await store.addFavorite(saveForm.value.name, saveForm.value.description)
    showSaveDialog.value = false
    saveForm.value = { name: '', description: '' }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    [joinTypes.value, loadDirections.value] = await Promise.all([
      getJoinTypes(),
      getLoadDirections()
    ])
    await store.loadFavorites()
  } catch (e) {
    console.error('初始化失败:', e)
  }
})
</script>

<style scoped>
.stress-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.stress-controls {
  display: flex;
  gap: 20px;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  color: rgba(255,255,255,0.9);
  font-size: 13px;
}

.control-unit {
  color: rgba(255,255,255,0.8);
  font-size: 12px;
}

.stress-legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.legend-title {
  color: rgba(255,255,255,0.9);
  font-size: 12px;
}

.legend-bar {
  display: flex;
  height: 16px;
  width: 150px;
  border-radius: 4px;
  overflow: hidden;
}

.legend-color {
  flex: 1;
}

.legend-color.low { background: #0080FF; }
.legend-color.mid-low { background: #80FFFF; }
.legend-color.mid { background: #FFFF00; }
.legend-color.mid-high { background: #FF8000; }
.legend-color.high { background: #FF0000; }

.legend-labels {
  display: flex;
  justify-content: space-between;
  width: 150px;
  font-size: 10px;
  color: rgba(255,255,255,0.7);
}

.stress-info-panel {
  display: flex;
  gap: 30px;
  padding: 8px 16px;
  background: #fff8f0;
  border-bottom: 1px solid #ffd591;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #606266;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.info-value.risk-low {
  color: #67c23a;
}

.info-value.risk-medium {
  color: #e6a23c;
}

.info-value.risk-high {
  color: #f56c6c;
}

.preview-canvas.with-stress-panel {
  height: calc(100% - 50px - 50px - 120px);
}
</style>