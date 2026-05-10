<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon class="logo-icon"><Flower /></el-icon>
          <h1 class="app-title">鲜花保鲜剂配方对比工具</h1>
        </div>
        <div class="header-subtitle">智能推荐 · 自定义配方 · 历史记录</div>
      </div>
    </header>

    <main class="app-main">
      <div class="control-panel">
        <el-tabs v-model="activeTab" class="control-tabs">
          <el-tab-pane label="实验控制" name="control">
            <template #label>
              <el-icon><Operation /></el-icon>
              <span>实验控制</span>
            </template>
            <div class="tab-content">
              <el-form label-position="top">
                <el-form-item label="选择鲜花类型">
                  <el-select
                    v-model="selectedFlowerType"
                    placeholder="请选择鲜花种类"
                    @change="handleFlowerChange"
                    style="width: 100%;"
                    size="large"
                    clearable
                  >
                    <el-option
                      v-for="type in flowerTypes"
                      :key="type"
                      :label="type"
                      :value="type"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="实验天数">
                  <el-slider
                    v-model="experimentDays"
                    :min="0"
                    :max="60"
                    :step="1"
                    show-stops
                    :marks="sliderMarks"
                    size="large"
                  />
                  <div class="days-display">
                    <el-tag type="info" size="large">{{ experimentDays }} 天</el-tag>
                  </div>
                </el-form-item>

                <el-form-item label="实验备注（可选）">
                  <el-input
                    v-model="experimentNote"
                    type="textarea"
                    :rows="2"
                    placeholder="记录一些实验信息..."
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-alert
                  v-if="hasCustomFormula"
                  type="success"
                  :closable="false"
                  show-icon
                  class="custom-alert"
                >
                  <template #title>
                    <span>已配置自定义配方 D，将参与对比实验</span>
                  </template>
                </el-alert>

                <div class="button-group">
                  <el-button
                    type="primary"
                    size="large"
                    :disabled="!selectedFlowerType"
                    @click="runSimulation"
                    :loading="loading"
                  >
                    <el-icon><Search /></el-icon>
                    <span>开始模拟实验</span>
                  </el-button>
                  
                  <el-button
                    type="success"
                    size="large"
                    :disabled="!selectedFlowerType"
                    @click="getRecommendations"
                    :loading="loading"
                  >
                    <el-icon><Star /></el-icon>
                    <span>查看配方推荐</span>
                  </el-button>
                </div>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="自定义配方" name="custom">
            <template #label>
              <el-icon><Edit /></el-icon>
              <span>自定义配方</span>
            </template>
            <div class="tab-content">
              <CustomFormulaForm 
                @saved="onCustomFormulaSaved"
                @deleted="onCustomFormulaDeleted"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史记录" name="history">
            <template #label>
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
              <el-tag v-if="historyCount > 0" type="danger" size="small" class="history-badge">
                {{ historyCount }}
              </el-tag>
            </template>
            <div class="tab-content">
              <ExperimentHistory 
                ref="historyRef"
                @record-selected="onRecordSelected"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="main-content">
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-title">
              <el-icon><DataLine /></el-icon>
              <span>配方综合对比（雷达图）</span>
              <el-tag v-if="hasCustomFormula" type="warning" size="small">
                含配方 D
              </el-tag>
              <el-button 
                size="small" 
                :icon="Refresh" 
                @click="refreshRadar"
                style="margin-left: auto;"
              >
                刷新
              </el-button>
            </div>
          </template>
          <div class="chart-wrapper">
            <FormulaRadarChart :formulas="allFormulas" />
          </div>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="chart-hint"
          >
            <template #title>
              <span>指标说明：保鲜天数越高越好；成本区域越大表示成本越低；易用性越高越方便。</span>
            </template>
          </el-alert>
        </el-card>

        <el-card class="section-card" shadow="hover" v-if="recommendations.length > 0">
          <template #header>
            <div class="card-title">
              <el-icon><Star /></el-icon>
              <span>{{ selectedFlowerType }} - 配方推荐</span>
            </div>
          </template>
          <RecommendationCard :recommendations="recommendations" />
        </el-card>

        <el-card class="section-card" shadow="hover" v-if="simulationResults.length > 0">
          <template #header>
            <div class="card-title">
              <el-icon><Timer /></el-icon>
              <span>
                对比实验结果 - {{ experimentDays }} 天后枯萎程度
                <el-tag v-if="recommendedFormula" :type="getFormulaTagType(recommendedFormula)" effect="dark" size="small" style="margin-left: 10px;">
                  最佳：配方{{ recommendedFormula }}
                </el-tag>
              </span>
            </div>
          </template>
          <SimulationProgress :results="simulationResults" />
        </el-card>

        <el-card class="section-card welcome-card" shadow="hover" 
          v-if="recommendations.length === 0 && simulationResults.length === 0">
          <div class="welcome-content">
            <el-empty description="请在左侧选择鲜花类型，开始使用">
              <template #image>
                <el-icon class="welcome-icon"><Flower /></el-icon>
              </template>
              <template #default>
                <p class="welcome-text">本工具可以帮助您：</p>
                <ul class="feature-list">
                  <li><el-icon><Check /></el-icon> 根据鲜花类型推荐最佳保鲜剂配方</li>
                  <li><el-icon><Check /></el-icon> 对比三种配方的综合指标（雷达图）</li>
                  <li><el-icon><Check /></el-icon> 模拟不同天数后的枯萎程度</li>
                  <li><el-icon><Check /></el-icon> <b style="color: #e6a23c;">自定义配方 D</b>，参与对比</li>
                  <li><el-icon><Check /></el-icon> <b style="color: #409eff;">历史记录</b>，自动保存实验</li>
                </ul>
              </template>
            </el-empty>
          </div>
        </el-card>
      </div>
    </main>

    <footer class="app-footer">
      <p>© 2026 鲜花保鲜剂配方对比工具 | 数据仅供参考</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { flowerService } from './api/flowerService'
import FormulaRadarChart from './components/FormulaRadarChart.vue'
import RecommendationCard from './components/RecommendationCard.vue'
import SimulationProgress from './components/SimulationProgress.vue'
import CustomFormulaForm from './components/CustomFormulaForm.vue'
import ExperimentHistory from './components/ExperimentHistory.vue'

const activeTab = ref('control')
const flowerTypes = ref([])
const allFormulas = ref([])
const selectedFlowerType = ref('')
const experimentDays = ref(7)
const experimentNote = ref('')
const recommendations = ref([])
const simulationResults = ref([])
const recommendedFormula = ref('')
const loading = ref(false)
const hasCustomFormula = ref(false)
const historyCount = ref(0)
const historyRef = ref(null)

const sliderMarks = {
  0: '0天',
  7: '7天',
  14: '14天',
  21: '21天',
  30: '30天',
  45: '45天',
  60: '60天'
}

const getFormulaTagType = (code) => {
  const types = { A: 'danger', B: 'primary', C: 'success', D: 'warning' }
  return types[code] || 'info'
}

const refreshRadar = async () => {
  try {
    const response = await flowerService.getRadarData(selectedFlowerType.value || null)
    allFormulas.value = response.data || []
    hasCustomFormula.value = response.hasCustomFormula || false
  } catch (error) {
    console.error('Refresh radar data error:', error)
  }
}

const checkCustomFormula = async () => {
  try {
    const response = await flowerService.getCustomFormula()
    hasCustomFormula.value = !!response.data
  } catch (error) {
    console.error('Check custom formula error:', error)
  }
}

const loadHistoryCount = async () => {
  try {
    const response = await flowerService.getExperimentRecords()
    historyCount.value = (response.data || []).length
  } catch (error) {
    console.error('Load history count error:', error)
  }
}

const initData = async () => {
  try {
    await flowerService.getOrCreateSession()
    const types = await flowerService.getFlowerTypes()
    flowerTypes.value = types
    await refreshRadar()
    await checkCustomFormula()
    await loadHistoryCount()
  } catch (error) {
    ElMessage.error(error.message || '初始化数据失败，请确保后端服务已启动')
    console.error('Init error:', error)
  }
}

const handleFlowerChange = () => {
  recommendations.value = []
  simulationResults.value = []
  recommendedFormula.value = ''
  experimentNote.value = ''
  refreshRadar()
}

const getRecommendations = async () => {
  if (!selectedFlowerType.value) {
    ElMessage.warning('请先选择鲜花类型')
    return
  }
  
  loading.value = true
  try {
    recommendations.value = await flowerService.getRecommendations(selectedFlowerType.value)
    ElMessage.success('推荐结果已生成')
  } catch (error) {
    ElMessage.error(error.message || '获取推荐失败')
    console.error('Recommendation error:', error)
  } finally {
    loading.value = false
  }
}

const runSimulation = async () => {
  if (!selectedFlowerType.value) {
    ElMessage.warning('请先选择鲜花类型')
    return
  }
  
  loading.value = true
  try {
    const response = await flowerService.runSimulationV2(
      selectedFlowerType.value,
      experimentDays.value,
      experimentNote.value
    )
    
    simulationResults.value = response.data || []
    recommendedFormula.value = response.recommendedFormula || ''
    
    ElMessage.success('模拟实验完成，记录已保存')
    await loadHistoryCount()
    
    if (historyRef.value) {
      historyRef.value.refresh()
    }
  } catch (error) {
    ElMessage.error(error.message || '模拟失败')
    console.error('Simulation error:', error)
  } finally {
    loading.value = false
  }
}

const onCustomFormulaSaved = async (data) => {
  hasCustomFormula.value = true
  await refreshRadar()
}

const onCustomFormulaDeleted = async () => {
  hasCustomFormula.value = false
  await refreshRadar()
}

const onRecordSelected = (record) => {
  console.log('Record selected:', record)
}

watch(activeTab, (newTab) => {
  if (newTab === 'history' && historyRef.value) {
    historyRef.value.refresh()
  }
})

onMounted(() => {
  initData()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 42px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
}

.header-subtitle {
  font-size: 13px;
  opacity: 0.9;
  margin-left: 54px;
}

.app-main {
  flex: 1;
  max-width: 1400px;
  margin: 25px auto;
  padding: 0 20px;
  width: 100%;
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 25px;
}

.control-panel {
  position: sticky;
  top: 25px;
  height: fit-content;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.control-tabs {
  --el-tabs-header-height: 52px;
}

.control-tabs :deep(.el-tabs__item) {
  padding: 0 18px;
  font-size: 14px;
  height: 52px;
  line-height: 52px;
}

.control-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

.control-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #e4e7ed;
}

.control-tabs :deep(.el-tabs__active-bar) {
  background-color: #409eff;
}

.control-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

.tab-content {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  padding-right: 5px;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
}

.days-display {
  text-align: center;
  margin-top: 8px;
}

.custom-alert {
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

.button-group .el-button {
  width: 100%;
}

.history-badge {
  margin-left: 6px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 15px 0;
}

.chart-hint {
  margin-top: 10px;
}

.welcome-card {
  border: 2px dashed #dcdfe6;
  background: #fafafa;
}

.welcome-content {
  padding: 15px 0;
}

.welcome-icon {
  font-size: 100px;
  color: #c0c4cc;
  margin-bottom: 15px;
}

.welcome-text {
  color: #606266;
  margin-bottom: 12px;
  font-size: 14px;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  max-width: 380px;
  margin: 0 auto;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
  font-size: 13px;
}

.feature-list li .el-icon {
  color: #67c23a;
  font-size: 16px;
  flex-shrink: 0;
}

.app-footer {
  background: #303133;
  color: #909399;
  text-align: center;
  padding: 18px;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .app-main {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    position: static;
  }
  
  .tab-content {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 768px) {
  .app-title {
    font-size: 22px;
  }
  
  .header-subtitle {
    margin-left: 0;
  }
  
  .app-main {
    margin: 15px auto;
    padding: 0 10px;
  }
  
  .control-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 13px;
  }
}
</style>
