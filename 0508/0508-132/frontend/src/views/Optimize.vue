<template>
  <div class="optimize-page">
    <div class="page-header">
      <h2 class="page-title">路径优化</h2>
      <el-button type="primary" @click="runOptimization" :disabled="!canOptimize" :loading="optimizing">
        <el-icon><MagicStick /></el-icon>
        开始优化
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>选择实验方案</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="实验方案">
              <el-select
                v-model="selectedExperimentId"
                placeholder="请选择实验方案"
                style="width: 100%"
                @change="onExperimentChange"
              >
                <el-option
                  v-for="exp in experiments"
                  :key="exp.id"
                  :label="exp.name"
                  :value="exp.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="起始位置">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number v-model="startRow" :min="0" :max="11" placeholder="行" style="width: 100%" />
                </el-col>
                <el-col :span="12">
                  <el-input-number v-model="startCol" :min="0" :max="11" placeholder="列" style="width: 100%" />
                </el-col>
              </el-row>
              <span style="font-size: 12px; color: #909399">移液枪起始位置 (行, 列)</span>
            </el-form-item>
          </el-form>
        </el-card>

        <el-alert
          v-if="result && result.overallWarningMessage"
          :type="getOverallAlertType(result)"
          :closable="false"
          style="margin-top: 20px"
        >
          <template #title>
            <strong>总体提醒</strong>
          </template>
          {{ result.overallWarningMessage }}
        </el-alert>

        <el-card style="margin-top: 20px" v-if="result">
          <template #header>
            <span>优化结果</span>
          </template>
          <div class="result-summary">
            <div class="result-item">
              <span class="label">算法：</span>
              <el-tag type="primary">{{ result.algorithmUsed }}</el-tag>
            </div>
            <div class="result-item">
              <span class="label">原始距离：</span>
              <span class="value">{{ formatDistance(result.originalDistance) }}</span>
            </div>
            <div class="result-item">
              <span class="label">优化后距离：</span>
              <span class="value highlight">{{ formatDistance(result.totalDistance) }}</span>
            </div>
            <div class="result-item">
              <span class="label">优化率：</span>
              <span
                class="value"
                :class="{ positive: result.improvementPercentage > 0 }"
              >
                {{ result.improvementPercentage.toFixed(2) }}%
              </span>
            </div>
            <div class="result-item">
              <span class="label">执行时间：</span>
              <span class="value">{{ result.executionTimeMs }}ms</span>
            </div>
            <div class="result-item" v-if="result.estimatedTipCount">
              <span class="label">预计吸头：</span>
              <el-tag type="warning">{{ result.estimatedTipCount }} 个</el-tag>
            </div>
            <div class="result-item" v-if="result.totalAccumulatedError">
              <span class="label">累积误差：</span>
              <span class="value" :class="{ 'error-high': result.totalAccumulatedError > 10 }">
                {{ result.totalAccumulatedError.toFixed(2) }} μl
              </span>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="result && result.volumeAccumulations && result.volumeAccumulations.length > 0">
          <template #header>
            <div class="header-with-icon">
              <el-icon><Warning /></el-icon>
              <span>体积误差统计</span>
            </div>
          </template>
          <div class="volume-warnings">
            <div
              v-for="(volume, idx) in result.volumeAccumulations"
              :key="idx"
              class="volume-item"
            >
              <div class="volume-header">
                <span class="reagent-name">{{ volume.reagentTypeName }}</span>
                <el-tag :type="getWarningTagType(volume.warningLevel)" size="small">
                  {{ getWarningLabel(volume.warningLevel) }}
                </el-tag>
              </div>
              <div class="volume-stats">
                <div class="stat">
                  <span class="label">总移液量：</span>
                  <span class="value">{{ volume.totalVolumeUl?.toFixed(1) }} μl</span>
                </div>
                <div class="stat">
                  <span class="label">移液次数：</span>
                  <span class="value">{{ volume.pipetteCount }} 次</span>
                </div>
                <div class="stat">
                  <span class="label">累积误差：</span>
                  <span class="value" :class="{ 'error-high': volume.warningLevel === 'HIGH' }">
                    {{ volume.accumulatedError?.toFixed(2) }} μl ({{ volume.errorPercentage?.toFixed(2) }}%)
                  </span>
                </div>
              </div>
              <div v-if="volume.warningMessage" class="warning-text">
                <el-icon><InfoFilled /></el-icon>
                {{ volume.warningMessage }}
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="result && result.tipChanges && result.tipChanges.length > 0">
          <template #header>
            <div class="header-with-icon">
              <el-icon><Refresh /></el-icon>
              <span>吸头更换提醒</span>
            </div>
          </template>
          <div class="tip-changes">
            <div
              v-for="(tip, idx) in result.tipChanges"
              :key="idx"
              class="tip-change-item"
            >
              <div class="tip-header">
                <el-tag type="danger">第 {{ tip.taskOrder }} 步前</el-tag>
                <span class="tip-group">换为第 {{ tip.tipGroupId + 1 }} 组吸头</span>
              </div>
              <div class="tip-reason">
                <el-icon><WarningFilled /></el-icon>
                {{ tip.reason }}
              </div>
              <div class="tip-recommendation">
                <el-icon><ChatDotRound /></el-icon>
                {{ tip.recommendation }}
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="result">
          <template #header>
            <span>手动调整顺序</span>
          </template>
          <div class="manual-adjust">
            <p>拖拽调整任务顺序，系统将重新计算距离：</p>
            <el-transfer
              v-model="manualOrder"
              :data="manualData"
              :titles="['可选任务', '执行顺序']"
              :props="{ key: 'id', label: 'displayText' }"
              :left-default-checked="[]"
              :right-default-checked="[]"
            />
            <el-button
              type="warning"
              style="margin-top: 10px; width: 100%"
              @click="calculateManual"
            >
              计算手动路径距离
            </el-button>
            <div v-if="manualDistance !== null" class="manual-result">
              <p>手动路径距离: <strong>{{ formatDistance(manualDistance) }}</strong></p>
              <p v-if="result">
                与优化结果差异: 
                <span :class="manualDistance > result.totalDistance ? 'negative' : 'positive'">
                  {{ ((manualDistance - result.totalDistance) / result.totalDistance * 100).toFixed(2) }}%
                </span>
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>优化后执行顺序</span>
              <span v-if="result" class="task-count">
                共 {{ result.optimizedOrder?.length || 0 }} 个任务
              </span>
            </div>
          </template>
          
          <div v-if="result && result.optimizedOrder && result.optimizedOrder.length > 0" class="path-visualization">
            <el-timeline>
              <el-timeline-item
                v-for="(task, index) in result.optimizedOrder"
                :key="task.id || index"
                :timestamp="`第 ${index + 1} 步`"
                placement="top"
                :type="getTimelineType(index)"
                :hollow="isTipChangeBeforeStep(index + 1)"
              >
                <el-card shadow="never" :class="{ 'tip-change-card': isTipChangeBeforeStep(index + 1) }">
                  <el-alert
                    v-if="isTipChangeBeforeStep(index + 1)"
                    type="warning"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 10px"
                  >
                    <template #title>
                      请更换吸头
                    </template>
                    {{ getTipChangeReason(index + 1) }}
                  </el-alert>
                  <h4>{{ task.sourceWellLabel || `源孔` }} → {{ task.targetWellLabel || `目标孔` }}</h4>
                  <p>
                    源位置: [{{ task.sourceRow }}, {{ task.sourceCol }}] |
                    目标位置: [{{ task.targetRow }}, {{ task.targetCol }}]
                  </p>
                  <p v-if="task.volumeUl">移液体积: {{ task.volumeUl }} μl</p>
                  <p v-if="task.segmentDistance" class="distance">
                    本段距离: {{ task.segmentDistance.toFixed(2) }} 单位
                  </p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          
          <el-empty v-else description="请先选择实验方案并点击开始优化" />
        </el-card>

        <el-card style="margin-top: 20px" v-if="experiment && result">
          <template #header>
            <span>路径可视化</span>
          </template>
          <div class="path-map" v-if="experiment.tubeRack">
            <div
              class="map-grid"
              :style="{
                gridTemplateColumns: `repeat(${experiment.tubeRack.columns}, 1fr)`,
                gridTemplateRows: `repeat(${experiment.tubeRack.rows}, 1fr)`
              }"
            >
              <template
                v-for="(row, rowIdx) in experiment.tubeRack.rows"
                :key="'row-' + rowIdx"
              >
                <div
                  v-for="(col, colIdx) in experiment.tubeRack.columns"
                  :key="rowIdx + '-' + colIdx"
                  class="map-cell"
                  :class="{
                    'start-position': isStartPosition(rowIdx, colIdx),
                    'source-cell': isSourceCell(rowIdx, colIdx),
                    'target-cell': isTargetCell(rowIdx, colIdx)
                  }"
                >
                  <div class="cell-label">{{ getCellLabel(rowIdx, colIdx) }}</div>
                  <div class="cell-number" v-if="getStepNumber(rowIdx, colIdx) !== null">
                    {{ getStepNumber(rowIdx, colIdx) }}
                  </div>
                </div>
              </template>
            </div>
            <div class="map-legend">
              <div class="legend-item">
                <div class="legend-color start"></div>
                <span>起始位置</span>
              </div>
              <div class="legend-item">
                <div class="legend-color source"></div>
                <span>源孔位</span>
              </div>
              <div class="legend-item">
                <div class="legend-color target"></div>
                <span>目标孔位</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const store = useAppStore()

const experiments = ref([])
const selectedExperimentId = ref(null)
const experiment = ref(null)
const startRow = ref(0)
const startCol = ref(0)
const optimizing = ref(false)
const result = ref(null)
const manualDistance = ref(null)
const manualOrder = ref([])

const canOptimize = computed(() => selectedExperimentId.value && experiment.value?.tasks?.length > 0)

const manualData = computed(() => {
  if (!result.value?.optimizedOrder) return []
  return result.value.optimizedOrder.map((task, idx) => ({
    id: idx,
    displayText: `${task.sourceWellLabel || idx + 1} → ${task.targetWellLabel || ''}`
  }))
})

onMounted(async () => {
  await loadExperiments()
  if (route.query.experimentId) {
    selectedExperimentId.value = Number(route.query.experimentId)
    await onExperimentChange(Number(route.query.experimentId))
  }
})

const loadExperiments = async () => {
  const response = await store.loadExperiments()
  if (response.success) {
    experiments.value = response.data
  }
}

const onExperimentChange = async (id) => {
  const response = await store.loadExperimentById(id)
  if (response.success) {
    experiment.value = response.data
    result.value = null
    manualDistance.value = null
    manualOrder.value = []
  }
}

const runOptimization = async () => {
  if (!experiment.value?.tasks?.length) {
    ElMessage.warning('该实验方案没有移液任务')
    return
  }

  optimizing.value = true
  try {
    const response = await store.optimizePath({
      tubeRackId: experiment.value.tubeRackId,
      tasks: experiment.value.tasks,
      startRow: startRow.value,
      startCol: startCol.value
    })
    if (response.success) {
      result.value = response.data
      ElMessage.success('优化完成！')
      manualOrder.value = response.data.optimizedOrder.map((_, idx) => idx)
    }
  } catch (e) {
    console.error('优化失败:', e)
    ElMessage.error('优化失败')
  } finally {
    optimizing.value = false
  }
}

const calculateManual = async () => {
  if (!result.value?.optimizedOrder) return
  
  const orderedTasks = manualOrder.value.map(idx => result.value.optimizedOrder[idx])
  const response = await store.calculateManualDistance(orderedTasks, startRow.value, startCol.value)
  if (response.success) {
    manualDistance.value = response.data
  }
}

const getTimelineType = (index) => {
  const types = ['primary', 'success', 'warning', 'info']
  return types[index % types.length]
}

const formatDistance = (dist) => {
  if (dist === null || dist === undefined) return '-'
  return `${dist.toFixed(2)} 单位`
}

const isStartPosition = (row, col) => {
  return row === startRow.value && col === startCol.value
}

const isSourceCell = (row, col) => {
  if (!result.value?.optimizedOrder) return false
  return result.value.optimizedOrder.some(t => t.sourceRow === row && t.sourceCol === col)
}

const isTargetCell = (row, col) => {
  if (!result.value?.optimizedOrder) return false
  return result.value.optimizedOrder.some(t => t.targetRow === row && t.targetCol === col)
}

const getCellLabel = (row, col) => {
  if (!experiment.value?.tubeRack?.wells) return ''
  const well = experiment.value.tubeRack.wells.find(w => w.rowNum === row && w.colNum === col)
  return well?.label || `${String.fromCharCode(65 + row)}${col + 1}`
}

const getStepNumber = (row, col) => {
  if (!result.value?.optimizedOrder) return null
  const idx = result.value.optimizedOrder.findIndex(
    t => (t.sourceRow === row && t.sourceCol === col) || (t.targetRow === row && t.targetCol === col)
  )
  return idx >= 0 ? idx + 1 : null
}

const getOverallAlertType = (result) => {
  if (result.volumeAccumulations?.some(v => v.warningLevel === 'HIGH')) {
    return 'error'
  }
  if (result.volumeAccumulations?.some(v => v.warningLevel === 'MEDIUM') ||
      (result.tipChanges && result.tipChanges.length > 0)) {
    return 'warning'
  }
  return 'success'
}

const getWarningTagType = (level) => {
  switch (level) {
    case 'HIGH': return 'danger'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'info'
    default: return 'success'
  }
}

const getWarningLabel = (level) => {
  switch (level) {
    case 'HIGH': return '高风险'
    case 'MEDIUM': return '中等'
    case 'LOW': return '注意'
    default: return '正常'
  }
}

const isTipChangeBeforeStep = (stepOrder) => {
  if (!result.value?.tipChanges) return false
  return result.value.tipChanges.some(t => t.taskOrder === stepOrder)
}

const getTipChangeReason = (stepOrder) => {
  if (!result.value?.tipChanges) return ''
  const tip = result.value.tipChanges.find(t => t.taskOrder === stepOrder)
  return tip ? tip.reason : ''
}
</script>

<style scoped lang="scss">
.optimize-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 22px;
      color: #303133;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .task-count {
      color: #909399;
      font-size: 13px;
    }
  }
  
  .header-with-icon {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .result-summary {
    .result-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .label {
        width: 90px;
        color: #606266;
        font-size: 13px;
      }
      
      .value {
        font-weight: 600;
        
        &.highlight {
          color: #67c23a;
          font-size: 18px;
        }
        
        &.positive {
          color: #67c23a;
        }
        
        &.error-high {
          color: #f56c6c;
        }
      }
    }
  }
  
  .volume-warnings {
    .volume-item {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .volume-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .reagent-name {
          font-weight: 600;
          color: #303133;
        }
      }
      
      .volume-stats {
        .stat {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
          
          .label {
            color: #909399;
          }
          
          .value {
            color: #606266;
            
            &.error-high {
              color: #f56c6c;
              font-weight: 600;
            }
          }
        }
      }
      
      .warning-text {
        margin-top: 8px;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        font-size: 12px;
        color: #e6a23c;
        display: flex;
        align-items: flex-start;
        gap: 4px;
      }
    }
  }
  
  .tip-changes {
    .tip-change-item {
      padding: 12px;
      background: linear-gradient(135deg, #fff7e6 0%, #ffedd5 100%);
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid #e6a23c;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .tip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .tip-group {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .tip-reason {
        font-size: 13px;
        color: #e6a23c;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 4px;
      }
      
      .tip-recommendation {
        font-size: 12px;
        color: #606266;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
  
  .manual-adjust {
    .manual-result {
      margin-top: 15px;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 6px;
      
      .positive {
        color: #67c23a;
      }
      .negative {
        color: #f56c6c;
      }
    }
  }
  
  .path-visualization {
    max-height: 500px;
    overflow-y: auto;
    
    h4 {
      margin: 0 0 8px 0;
      color: #303133;
    }
    
    p {
      margin: 4px 0;
      font-size: 13px;
      color: #606266;
      
      &.distance {
        color: #409eff;
        font-weight: 600;
      }
    }
    
    .tip-change-card {
      border: 1px solid #e6a23c;
      background: #fffdf5;
    }
  }
  
  .path-map {
    .map-grid {
      display: grid;
      gap: 8px;
      background: #f5f7fa;
      padding: 20px;
      border-radius: 8px;
      
      .map-cell {
        aspect-ratio: 1;
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px solid #e4e7ed;
        position: relative;
        
        &.start-position {
          border-color: #409eff;
          background: #ecf5ff;
        }
        
        &.source-cell {
          border-color: #e6a23c;
          background: #fdf6ec;
        }
        
        &.target-cell {
          border-color: #67c23a;
          background: #f0f9eb;
        }
        
        .cell-label {
          font-size: 11px;
          color: #606266;
        }
        
        .cell-number {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          background: #409eff;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
    
    .map-legend {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      justify-content: center;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          
          &.start { background: #ecf5ff; border: 2px solid #409eff; }
          &.source { background: #fdf6ec; border: 2px solid #e6a23c; }
          &.target { background: #f0f9eb; border: 2px solid #67c23a; }
        }
      }
    }
  }
}
</style>