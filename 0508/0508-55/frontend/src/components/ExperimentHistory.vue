<template>
  <div class="experiment-history">
    <div class="history-header">
      <div class="header-left">
        <el-icon><Clock /></el-icon>
        <span class="title">历史实验记录</span>
        <el-tag v-if="records.length > 0" type="info" size="small">
          共 {{ records.length }} 条
        </el-tag>
      </div>
      <el-button 
        v-if="records.length > 0"
        type="primary" 
        size="small" 
        :icon="Refresh"
        @click="loadRecords"
        :loading="loading"
      >
        刷新
      </el-button>
    </div>

    <el-divider style="margin: 15px 0;" />

    <el-empty v-if="!loading && records.length === 0" description="暂无历史记录">
      <el-icon class="empty-icon"><Document /></el-icon>
      <template #default>
        <span>完成一次模拟实验后，记录会自动保存在这里</span>
      </template>
    </el-empty>

    <div v-else-if="!loading" class="records-list">
      <div 
        v-for="record in records" 
        :key="record.id" 
        class="record-item"
        @click="showDetail(record)"
      >
        <div class="record-main">
          <div class="record-title">
            <el-icon><Flower /></el-icon>
            <span class="flower-type">{{ record.flowerType }}</span>
            <el-tag size="small" type="info">{{ record.experimentDays }}天</el-tag>
            <el-tag 
              v-if="record.recommendedFormula" 
              :type="getFormulaTagType(record.recommendedFormula)" 
              size="small"
              effect="dark"
            >
              最佳：配方{{ record.recommendedFormula }}
            </el-tag>
          </div>
          
          <div class="record-summary">
            <div class="summary-item">
              <span class="label">A:</span>
              <span :class="getResultClass(record.formulaAResult)">
                {{ record.formulaAResult?.toFixed(1) }}%
              </span>
            </div>
            <div class="summary-item">
              <span class="label">B:</span>
              <span :class="getResultClass(record.formulaBResult)">
                {{ record.formulaBResult?.toFixed(1) }}%
              </span>
            </div>
            <div class="summary-item">
              <span class="label">C:</span>
              <span :class="getResultClass(record.formulaCResult)">
                {{ record.formulaCResult?.toFixed(1) }}%
              </span>
            </div>
            <div v-if="record.formulaDExists" class="summary-item">
              <span class="label">D:</span>
              <span :class="getResultClass(record.formulaDResult)">
                {{ record.formulaDResult?.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
        
        <div class="record-meta">
          <span class="record-time">
            <el-icon><Timer /></el-icon>
            {{ formatTime(record.createdAt) }}
          </span>
          <el-button 
            type="danger" 
            size="small" 
            :icon="Delete"
            @click.stop="deleteRecord(record)"
          >
            删除
          </el-button>
        </div>
        
        <div v-if="record.note" class="record-note">
          <el-icon><EditPen /></el-icon>
          <span>{{ record.note }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="实验详情"
      width="500px"
    >
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-header">
          <el-tag size="large" type="info">{{ currentRecord.flowerType }}</el-tag>
          <span class="detail-days">实验 {{ currentRecord.experimentDays }} 天</span>
        </div>
        
        <el-divider />
        
        <div class="detail-formulas">
          <div class="detail-formula">
            <el-tag type="danger">配方A</el-tag>
            <div class="formula-result">
              <span class="result-value" :class="getResultClass(currentRecord.formulaAResult)">
                {{ currentRecord.formulaAResult?.toFixed(1) }}%
              </span>
              <el-tag size="small">{{ currentRecord.formulaAStatus }}</el-tag>
            </div>
          </div>
          
          <div class="detail-formula">
            <el-tag type="primary">配方B</el-tag>
            <div class="formula-result">
              <span class="result-value" :class="getResultClass(currentRecord.formulaBResult)">
                {{ currentRecord.formulaBResult?.toFixed(1) }}%
              </span>
              <el-tag size="small">{{ currentRecord.formulaBStatus }}</el-tag>
            </div>
          </div>
          
          <div class="detail-formula">
            <el-tag type="success">配方C</el-tag>
            <div class="formula-result">
              <span class="result-value" :class="getResultClass(currentRecord.formulaCResult)">
                {{ currentRecord.formulaCResult?.toFixed(1) }}%
              </span>
              <el-tag size="small">{{ currentRecord.formulaCStatus }}</el-tag>
            </div>
          </div>
          
          <div v-if="currentRecord.formulaDExists" class="detail-formula">
            <el-tag type="warning">配方D</el-tag>
            <span class="formula-d-name">{{ currentRecord.formulaDName || '自定义配方' }}</span>
            <div class="formula-result">
              <span class="result-value" :class="getResultClass(currentRecord.formulaDResult)">
                {{ currentRecord.formulaDResult?.toFixed(1) }}%
              </span>
              <el-tag size="small">{{ currentRecord.formulaDStatus }}</el-tag>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="detail-footer">
          <div class="best-formula">
            <el-icon><Star /></el-icon>
            <span>推荐配方：</span>
            <el-tag 
              :type="getFormulaTagType(currentRecord.recommendedFormula)" 
              effect="dark"
            >
              配方{{ currentRecord.recommendedFormula }}
            </el-tag>
          </div>
          <div class="detail-time">
            <el-icon><Clock /></el-icon>
            <span>记录时间：{{ formatTime(currentRecord.createdAt) }}</span>
          </div>
          <div v-if="currentRecord.note" class="detail-note">
            <el-icon><EditPen /></el-icon>
            <span>备注：{{ currentRecord.note }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Clock, Refresh, Document, Flower, Timer, Delete, Loading, EditPen, Star 
} from '@element-plus/icons-vue'
import { flowerService } from '../api/flowerService'

const emit = defineEmits(['record-selected'])

const records = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentRecord = ref(null)

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFormulaTagType = (code) => {
  const types = { A: 'danger', B: 'primary', C: 'success', D: 'warning' }
  return types[code] || 'info'
}

const getResultClass = (percentage) => {
  if (percentage == null) return ''
  if (percentage < 20) return 'result-fresh'
  if (percentage < 50) return 'result-good'
  if (percentage < 80) return 'result-wilting'
  return 'result-dead'
}

const loadRecords = async () => {
  loading.value = true
  try {
    const response = await flowerService.getExperimentRecords()
    records.value = response.data || []
  } catch (error) {
    ElMessage.error(error.message || '加载历史记录失败')
  } finally {
    loading.value = false
  }
}

const showDetail = (record) => {
  currentRecord.value = record
  detailVisible.value = true
}

const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条 ${record.flowerType} 的实验记录吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await flowerService.deleteExperimentRecord(record.id)
    if (response.success) {
      ElMessage.success('记录已删除')
      await loadRecords()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const refresh = () => {
  loadRecords()
}

defineExpose({ refresh })

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.experiment-history {
  width: 100%;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.empty-icon {
  font-size: 80px;
  color: #c0c4cc;
  margin-bottom: 20px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.record-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flower-type {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.record-summary {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.summary-item .label {
  color: #909399;
  font-weight: 600;
}

.result-fresh {
  color: #67c23a;
  font-weight: 600;
}

.result-good {
  color: #e6a23c;
  font-weight: 600;
}

.result-wilting {
  color: #f56c6c;
  font-weight: 600;
}

.result-dead {
  color: #909399;
  font-weight: 600;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.record-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}

.record-note {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 15px;
  color: #909399;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.detail-content {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.detail-days {
  font-size: 15px;
  color: #606266;
}

.detail-formulas {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-formula {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.formula-d-name {
  color: #909399;
  font-size: 13px;
}

.formula-result {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.result-value {
  font-size: 20px;
  font-weight: bold;
}

.detail-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.best-formula,
.detail-time,
.detail-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}
</style>
