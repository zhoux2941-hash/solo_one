<template>
  <div class="inventory">
    <div class="page-header">
      <h2>用水量预测与备水提醒</h2>
      <el-button type="primary" @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新预测
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon :size="28"><Box /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ summary?.totalStock || 0 }}</div>
            <div class="stat-label">当前库存总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ summary?.totalMinStock || 0 }}</div>
            <div class="stat-label">最低安全库存</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon :size="28"><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value" :class="{'warning-text': urgentCount > 0}">{{ urgentCount }}</div>
            <div class="stat-label">紧急/高优先级</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon :size="28"><Plus /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value" :class="{'warning-text': summary?.totalRecommendedQty > 0}">
              {{ summary?.totalRecommendedQty || 0 }}
            </div>
            <div class="stat-label">建议补货总量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>备水建议列表</span>
              <el-tag v-if="urgentCount > 0" type="danger" effect="dark">
                {{ urgentCount }} 个楼层需紧急备货
              </el-tag>
              <el-tag v-else type="success">库存充足</el-tag>
            </div>
          </template>

          <div v-for="rec in recommendations" :key="rec.floor" class="recommendation-card" :class="getCardClass(rec.urgencyLevel)">
            <div class="rec-header">
              <div class="floor-info">
                <span class="floor-number">{{ rec.floor }}楼</span>
                <el-tag :type="getTagType(rec.urgencyLevel)" effect="dark" size="small">
                  {{ getUrgencyLabel(rec.urgencyLevel) }}
                </el-tag>
              </div>
              <div class="rec-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="showRestockDialog(rec)"
                  :disabled="rec.recommendedQuantity <= 0"
                >
                  <el-icon><Plus /></el-icon>
                  确认补货
                </el-button>
              </div>
            </div>

            <div class="rec-content">
              <div class="inventory-bar">
                <div class="bar-info">
                  <span>当前库存: <strong>{{ rec.currentStock }}</strong> 桶</span>
                  <span>安全库存: {{ rec.minStock }} 桶</span>
                  <span>最大容量: {{ rec.maxStock }} 桶</span>
                </div>
                <el-progress 
                  :percentage="Math.round((rec.currentStock / rec.maxStock) * 100)"
                  :color="getProgressColor(rec.urgencyLevel)"
                  :stroke-width="16"
                />
              </div>

              <el-row :gutter="20" style="margin-top: 16px;">
                <el-col :span="8">
                  <div class="prediction-box">
                    <div class="prediction-label">预计未来2小时消耗</div>
                    <div class="prediction-value">{{ rec.predictedConsumption2H }} 桶</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="prediction-box">
                    <div class="prediction-label">2小时后预计库存</div>
                    <div class="prediction-value" :class="{'low-stock': rec.stockAfter2H < rec.minStock}">
                      {{ rec.stockAfter2H }} 桶
                    </div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="prediction-box">
                    <div class="prediction-label">预计耗尽时间</div>
                    <div class="prediction-value">
                      {{ formatDepletionTime(rec.estimatedDepletionTime) }}
                    </div>
                  </div>
                </el-col>
              </el-row>

              <div class="recommendation-msg" v-if="rec.message">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ rec.message }}</span>
              </div>

              <div class="recommendation-amount" v-if="rec.recommendedQuantity > 0">
                <el-icon><ShoppingCart /></el-icon>
                <span>建议补充: <strong>{{ rec.recommendedQuantity }}</strong> 桶水</span>
              </div>
            </div>
          </div>

          <el-empty v-if="recommendations.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog 
      v-model="restockDialogVisible" 
      title="确认补货" 
      width="450px"
    >
      <div v-if="currentRec">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="楼层">{{ currentRec.floor }}楼</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentRec.currentStock }} 桶</el-descriptions-item>
          <el-descriptions-item label="建议补货">{{ currentRec.recommendedQuantity }} 桶</el-descriptions-item>
          <el-descriptions-item label="补货后库存">
            {{ currentRec.currentStock + restockQuantity }} 桶
          </el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <el-form>
            <el-form-item label="补货数量">
              <el-input-number 
                v-model="restockQuantity" 
                :min="1" 
                :max="currentRec.maxStock - currentRec.currentStock"
              />
              <span style="margin-left: 12px; color: #909399;">桶</span>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="restockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRestock" :loading="restocking">
          确认补货
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Box, Warning, Bell, Plus, InfoFilled, ShoppingCart } from '@element-plus/icons-vue'
import { getRestockRecommendations, getPredictionSummary, restockFloor } from '../api'

const recommendations = ref([])
const summary = ref(null)
const loading = ref(false)
const restockDialogVisible = ref(false)
const restockQuantity = ref(0)
const restocking = ref(false)
const currentRec = ref(null)
let refreshTimer = null

const urgentCount = computed(() => {
  if (!recommendations.value) return 0
  return recommendations.value.filter(r => 
    ['CRITICAL', 'URGENT', 'HIGH'].includes(r.urgencyLevel)
  ).length
})

const refreshData = async () => {
  loading.value = true
  try {
    const [recResponse, summaryResponse] = await Promise.all([
      getRestockRecommendations(),
      getPredictionSummary()
    ])
    recommendations.value = recResponse.data
    summary.value = summaryResponse.data
  } catch (error) {
    ElMessage.error('获取备水建议失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const showRestockDialog = (rec) => {
  currentRec.value = rec
  restockQuantity.value = Math.max(1, rec.recommendedQuantity)
  restockDialogVisible.value = true
}

const confirmRestock = async () => {
  if (!currentRec.value) return
  
  restocking.value = true
  try {
    await restockFloor(currentRec.value.floor, restockQuantity.value)
    ElMessage.success(`${currentRec.value.floor}楼已成功补货 ${restockQuantity.value} 桶`)
    restockDialogVisible.value = false
    await refreshData()
  } catch (error) {
    ElMessage.error('补货操作失败')
  } finally {
    restocking.value = false
  }
}

const getCardClass = (urgencyLevel) => {
  switch (urgencyLevel) {
    case 'CRITICAL': return 'card-critical'
    case 'URGENT': return 'card-urgent'
    case 'HIGH': return 'card-high'
    case 'MEDIUM': return 'card-medium'
    case 'LOW': return 'card-low'
    default: return 'card-normal'
  }
}

const getTagType = (urgencyLevel) => {
  switch (urgencyLevel) {
    case 'CRITICAL': return 'danger'
    case 'URGENT': return 'danger'
    case 'HIGH': return 'warning'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'info'
    default: return 'success'
  }
}

const getUrgencyLabel = (urgencyLevel) => {
  switch (urgencyLevel) {
    case 'CRITICAL': return '紧急'
    case 'URGENT': return '高'
    case 'HIGH': return '较高'
    case 'MEDIUM': return '中'
    case 'LOW': return '低'
    default: return '正常'
  }
}

const getProgressColor = (urgencyLevel) => {
  switch (urgencyLevel) {
    case 'CRITICAL': return '#f56c6c'
    case 'URGENT': return '#f56c6c'
    case 'HIGH': return '#e6a23c'
    case 'MEDIUM': return '#e6a23c'
    case 'LOW': return '#909399'
    default: return '#67c23a'
  }
}

const formatDepletionTime = (time) => {
  if (!time) return '充足'
  const date = new Date(time)
  const now = new Date()
  const diffMs = date - now
  
  if (diffMs < 0) {
    return '已耗尽'
  }
  
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    const diffMins = Math.round(diffMs / (1000 * 60))
    return `约 ${diffMins} 分钟后`
  } else if (diffHours < 24) {
    return `约 ${diffHours} 小时后`
  } else {
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }
}

onMounted(() => {
  refreshData()
  refreshTimer = setInterval(refreshData, 60000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.inventory {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  margin-bottom: 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  float: left;
  margin-right: 16px;
  color: white;
}

.stat-content {
  overflow: hidden;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}

.warning-text {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-card {
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-critical {
  background: linear-gradient(135deg, #ffecec 0%, #fff 100%);
  border-left: 4px solid #f56c6c;
  animation: pulse-critical 2s infinite;
}

.card-urgent {
  background: linear-gradient(135deg, #fff5e6 0%, #fff 100%);
  border-left: 4px solid #e6a23c;
}

.card-high {
  background: linear-gradient(135deg, #fff8e6 0%, #fff 100%);
  border-left: 4px solid #e6a23c;
}

.card-medium {
  background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
  border-left: 4px solid #f0c78a;
}

.card-low {
  border-left: 4px solid #909399;
}

.card-normal {
  border-left: 4px solid #67c23a;
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
  }
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.floor-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.floor-number {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.rec-content {
  padding-top: 12px;
}

.bar-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.prediction-box {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.prediction-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.prediction-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.prediction-value.low-stock {
  color: #f56c6c;
}

.recommendation-msg {
  margin-top: 16px;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 6px;
  color: #409eff;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendation-amount {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  color: #67c23a;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendation-amount strong {
  font-size: 18px;
  color: #67c23a;
}
</style>
