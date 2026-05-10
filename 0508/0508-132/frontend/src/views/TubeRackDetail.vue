<template>
  <div class="tube-rack-detail-page">
    <div class="page-header">
      <div>
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">{{ tubeRack?.name || '试管架详情' }}</h2>
        <p v-if="tubeRack" class="rack-dimensions">
          {{ tubeRack.rows }} 行 × {{ tubeRack.columns }} 列
        </p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>试剂类型</span>
          </template>
          <div class="reagent-selector">
            <div
              v-for="reagent in store.reagentTypes"
              :key="reagent.code"
              class="reagent-item"
              :class="{ active: selectedReagent === reagent.code }"
              @click="selectedReagent = reagent.code"
            >
              <div
                class="reagent-color"
                :style="{ backgroundColor: reagent.color }"
              ></div>
              <span>{{ reagent.name }}</span>
            </div>
          </div>
          <el-divider />
          <div class="tips">
            <p><strong>操作说明：</strong></p>
            <ul>
              <li>选择左侧试剂类型</li>
              <li>点击孔位设置试剂</li>
              <li>按住拖拽可批量设置</li>
              <li>支持点击添加备注</li>
            </ul>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card v-loading="loading">
          <template v-if="tubeRack">
            <div class="rack-container">
              <div class="column-labels">
                <div class="corner-cell"></div>
                <div
                  v-for="col in tubeRack.columns"
                  :key="col"
                  class="column-label"
                >
                  {{ col }}
                </div>
              </div>
              
              <div
                v-for="(row, rowIndex) in tubeRack.rows"
                :key="rowIndex"
                class="rack-row"
              >
                <div class="row-label">{{ String.fromCharCode(65 + rowIndex) }}</div>
                <div
                  v-for="(col, colIndex) in tubeRack.columns"
                  :key="colIndex"
                  class="well-cell"
                  @click="handleWellClick(rowIndex, colIndex)"
                  @mousedown="startDrag(rowIndex, colIndex)"
                  @mouseenter="handleDrag(rowIndex, colIndex)"
                  @mouseup="endDrag"
                  @mouseleave="endDrag"
                >
                  <div
                    class="well-circle"
                    :style="{ backgroundColor: getWellColor(rowIndex, colIndex) }"
                  >
                    <span class="well-label">{{ getWellLabel(rowIndex, colIndex) }}</span>
                  </div>
                  <div
                    class="well-type-badge"
                    :style="{ backgroundColor: getWellColor(rowIndex, colIndex) }"
                  >
                    {{ getWellTypeName(rowIndex, colIndex) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showWellDialog" title="孔位详情" width="400px">
      <el-form v-if="currentWell" label-width="80px">
        <el-form-item label="位置">
          <span>{{ currentWell.label }}</span>
        </el-form-item>
        <el-form-item label="试剂类型">
          <el-select v-model="currentWell.reagentType">
            <el-option
              v-for="reagent in store.reagentTypes"
              :key="reagent.code"
              :label="reagent.name"
              :value="reagent.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义标签">
          <el-input v-model="currentWell.label" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="currentWell.notes"
            type="textarea"
            :rows="3"
            placeholder="添加备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWellDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCurrentWell">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const loading = ref(false)
const tubeRackId = computed(() => Number(route.params.id))
const tubeRack = computed(() => store.currentTubeRack)

const selectedReagent = ref('SAMPLE_A')
const isDragging = ref(false)
const dragStartPos = ref(null)
const showWellDialog = ref(false)
const currentWell = ref(null)

onMounted(async () => {
  await loadTubeRack()
})

const loadTubeRack = async () => {
  loading.value = true
  try {
    const response = await store.loadTubeRackById(tubeRackId.value)
    if (!response.success) {
      ElMessage.error('加载失败')
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

const getWell = (row, col) => {
  if (!tubeRack.value?.wells) return null
  return tubeRack.value.wells.find(w => w.rowNum === row && w.colNum === col)
}

const getWellColor = (row, col) => {
  const well = getWell(row, col)
  return well ? store.getReagentColor(well.reagentType) : '#ffffff'
}

const getWellLabel = (row, col) => {
  const well = getWell(row, col)
  return well?.label || `${String.fromCharCode(65 + row)}${col + 1}`
}

const getWellTypeName = (row, col) => {
  const well = getWell(row, col)
  return well ? store.getReagentName(well.reagentType) : '空孔'
}

const handleWellClick = async (row, col) => {
  if (isDragging.value) return
  const well = getWell(row, col)
  if (well) {
    await store.updateWell(tubeRackId.value, row, col, {
      reagentType: selectedReagent.value
    })
  }
}

const startDrag = (row, col) => {
  isDragging.value = true
  dragStartPos.value = { row, col }
  handleWellClick(row, col)
}

const handleDrag = (row, col) => {
  if (!isDragging.value) return
  const well = getWell(row, col)
  if (well) {
    store.updateWell(tubeRackId.value, row, col, {
      reagentType: selectedReagent.value
    })
  }
}

const endDrag = () => {
  isDragging.value = false
  dragStartPos.value = null
}

const showWellDetail = async (row, col) => {
  const well = getWell(row, col)
  if (well) {
    currentWell.value = { ...well }
    showWellDialog.value = true
  }
}

const saveCurrentWell = async () => {
  if (!currentWell.value) return
  try {
    const response = await store.updateWell(
      tubeRackId.value,
      currentWell.value.rowNum,
      currentWell.value.colNum,
      {
        reagentType: currentWell.value.reagentType,
        label: currentWell.value.label,
        notes: currentWell.value.notes
      }
    )
    if (response.success) {
      ElMessage.success('保存成功')
      showWellDialog.value = false
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const goBack = () => {
  router.push('/tube-racks')
}
</script>

<style scoped lang="scss">
.tube-rack-detail-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #303133;
    }
    
    .rack-dimensions {
      margin: 0;
      color: #909399;
    }
  }
  
  .reagent-selector {
    .reagent-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 5px;
      transition: all 0.2s;
      
      &:hover {
        background: #f5f7fa;
      }
      
      &.active {
        background: #ecf5ff;
        border: 1px solid #409eff;
      }
      
      .reagent-color {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid #dcdfe6;
      }
    }
  }
  
  .tips {
    font-size: 13px;
    color: #606266;
    
    ul {
      padding-left: 20px;
      margin: 10px 0;
      
      li {
        margin-bottom: 5px;
      }
    }
  }
  
  .rack-container {
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .column-labels {
      display: flex;
      margin-left: 40px;
      margin-bottom: 5px;
      
      .corner-cell {
        width: 40px;
      }
      
      .column-label {
        width: 70px;
        text-align: center;
        font-weight: 600;
        color: #606266;
      }
    }
    
    .rack-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .row-label {
        width: 40px;
        font-weight: 600;
        color: #606266;
      }
      
      .well-cell {
        width: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        user-select: none;
        
        .well-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #dcdfe6;
          transition: all 0.2s;
          position: relative;
          
          &:hover {
            transform: scale(1.1);
            border-color: #409eff;
          }
          
          .well-label {
            font-size: 11px;
            color: #303133;
            font-weight: 500;
          }
        }
        
        .well-type-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-top: 3px;
          color: #303133;
          white-space: nowrap;
          max-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}
</style>