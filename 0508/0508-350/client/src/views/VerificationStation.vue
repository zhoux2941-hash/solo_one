<template>
  <div class="verification-station">
    <div class="page-header">
      <h2>归并校核台</h2>
      <p class="subtitle">渔船加冰申请、舱位分配、装载回单、结算预览一体化校核</p>
    </div>

    <div class="filter-bar">
      <el-select v-model="selectedShipId" placeholder="选择渔船" clearable style="width: 200px">
        <el-option
          v-for="ship in shipList"
          :key="ship.shipId"
          :label="ship.shipName"
          :value="ship.shipId"
        />
      </el-select>
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 150px">
        <el-option label="待分配" value="pending" />
        <el-option label="已分配" value="allocated" />
        <el-option label="装载中" value="loading" />
        <el-option label="已完成" value="completed" />
      </el-select>
    </div>

    <div v-loading="loading" class="content-area">
      <el-collapse v-model="activeNames" accordion>
        <el-collapse-item
          v-for="item in filteredMergedData"
          :key="item.application.id"
          :name="item.application.id"
        >
          <template #title>
            <div class="collapse-title">
              <span class="ship-name">{{ item.application.shipName }}</span>
              <span class="application-no">申请单号: {{ item.application.applicationNo }}</span>
              <el-tag :type="getStatusType(item.application.status)" size="small">
                {{ getStatusText(item.application.status) }}
              </el-tag>
              <span class="batch-count">{{ item.batches.length }} 个批次</span>
              <span class="ice-amount">申请量: {{ item.application.plannedIceAmount.toFixed(2) }} 吨</span>
            </div>
          </template>

          <div class="batches-container">
            <div
              v-for="batch in item.batches"
              :key="batch.batchId"
              class="batch-section"
            >
              <div class="batch-header">
                <el-tag type="info" size="large">
                  <el-icon><Operation /></el-icon>
                  {{ batch.batchNo }}
                </el-tag>
                <span class="batch-time">
                  分配时间: {{ formatTime(batch.allocation.allocationTime) }}
                </span>
              </div>

              <div class="document-merge">
                <el-row :gutter="16">
                  <el-col :span="6">
                    <AllocationCard
                      :allocation="batch.allocation"
                      :application-id="item.application.id"
                      @update:allocation="(id, cabins) => handleAllocationUpdate(id, cabins, item.application.id)"
                    />
                  </el-col>
                  <el-col :span="6">
                    <ReceiptCard
                      :receipts="batch.receipts"
                      :affected-receipts="currentVerification?.affectedReceipts || []"
                    />
                  </el-col>
                  <el-col :span="6">
                    <SettlementCard
                      :settlements="batch.settlements"
                      :affected-settlements="currentVerification?.affectedSettlements || []"
                    />
                  </el-col>
                  <el-col :span="6">
                    <div class="batch-summary">
                      <div class="summary-card">
                        <div class="summary-title">批次汇总</div>
                        <div class="summary-item">
                          <span class="label">分配量</span>
                          <span class="value green">{{ batch.allocation.totalAllocatedAmount.toFixed(2) }} 吨</span>
                        </div>
                        <div class="summary-item">
                          <span class="label">实装量</span>
                          <span class="value blue">{{ getBatchLoadedAmount(batch).toFixed(2) }} 吨</span>
                        </div>
                        <div class="summary-item">
                          <span class="label">结算金额</span>
                          <span class="value red">¥ {{ getBatchSettlementAmount(batch).toFixed(2) }}</span>
                        </div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <div class="cabin-diagram-section">
                <h4>舱位示意图</h4>
                <CabinDiagram
                  :cabins="batch.allocation.cabins"
                  :receipt-cabins="batch.receipts[0]?.cabins || []"
                  :editable="true"
                  @update:cabins="(newCabins) => handleCabinChange(batch.allocation.id, newCabins)"
                />
              </div>
            </div>
          </div>

          <div v-if="currentVerification && currentVerification.warnings.length > 0" class="verification-warnings">
            <el-alert
              v-for="(warning, idx) in currentVerification.warnings"
              :key="idx"
              :type="warning.severity === 'error' ? 'error' : 'warning'"
              :title="warning.message"
              show-icon
              style="margin-bottom: 8px"
            />
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Operation } from '@element-plus/icons-vue'
import { mergedDataApi, verificationApi, allocationApi } from '../api'
import type { MergedData, BatchData, VerificationResult, AllocatedCabin } from '../types'
import AllocationCard from '../components/AllocationCard.vue'
import ReceiptCard from '../components/ReceiptCard.vue'
import SettlementCard from '../components/SettlementCard.vue'
import CabinDiagram from '../components/CabinDiagram.vue'

const loading = ref(false)
const mergedData = ref<MergedData[]>([])
const activeNames = ref<string[]>([])
const selectedShipId = ref('')
const statusFilter = ref('')
const currentVerification = ref<VerificationResult | null>(null)

const shipList = computed(() => {
  const ships = new Map<string, string>()
  mergedData.value.forEach(item => {
    ships.set(item.application.shipId, item.application.shipName)
  })
  return Array.from(ships.entries()).map(([shipId, shipName]) => ({ shipId, shipName }))
})

const filteredMergedData = computed(() => {
  return mergedData.value.filter(item => {
    if (selectedShipId.value && item.application.shipId !== selectedShipId.value) {
      return false
    }
    if (statusFilter.value && item.application.status !== statusFilter.value) {
      return false
    }
    return true
  })
})

const loadData = async () => {
  loading.value = true
  try {
    const response = await mergedDataApi.getAll()
    if (response.data.success) {
      mergedData.value = response.data.data
      if (mergedData.value.length > 0) {
        activeNames.value = [mergedData.value[0].application.id]
      }
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleCabinChange = async (allocationId: string, newCabins: AllocatedCabin[]) => {
  const allocation = mergedData.value
    .flatMap(d => d.batches)
    .find(b => b.allocation.id === allocationId)?.allocation
  
  if (!allocation) return

  try {
    const response = await verificationApi.verifyCabinChange(
      allocationId,
      allocation.cabins,
      newCabins
    )
    currentVerification.value = response.data.data
  } catch (error) {
    console.error('校核失败', error)
  }
}

const handleAllocationUpdate = async (allocationId: string, newCabins: AllocatedCabin[], applicationId: string) => {
  try {
    const response = await allocationApi.update(allocationId, newCabins)
    if (response.data.success) {
      ElMessage.success('舱位分配已更新')
      currentVerification.value = response.data.verification || null
      await loadData()
      activeNames.value = [applicationId]
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const getBatchLoadedAmount = (batch: BatchData): number => {
  return batch.receipts.reduce((sum, r) => sum + r.totalLoadedAmount, 0)
}

const getBatchSettlementAmount = (batch: BatchData): number => {
  return batch.settlements.reduce((sum, s) => sum + s.totalAmount, 0)
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    allocated: 'primary',
    loading: 'warning',
    completed: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待分配',
    allocated: '已分配',
    loading: '装载中',
    completed: '已完成'
  }
  return textMap[status] || status
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.verification-station {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #606266;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.content-area {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.ship-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.application-no {
  color: #909399;
  font-size: 13px;
}

.batch-count {
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
}

.ice-amount {
  margin-left: auto;
  color: #409eff;
  font-weight: 500;
}

.batches-container {
  padding: 16px 0;
}

.batch-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.batch-section:last-child {
  margin-bottom: 0;
}

.batch-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.batch-time {
  font-size: 13px;
  color: #909399;
}

.document-merge {
  padding: 8px 0;
}

.batch-summary {
  height: 100%;
}

.summary-card {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border: 1px solid #a0cfff;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.summary-title {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #a0cfff;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}

.summary-item .label {
  color: #606266;
}

.summary-item .value {
  font-weight: 600;
}

.summary-item .value.green {
  color: #67c23a;
}

.summary-item .value.blue {
  color: #409eff;
}

.summary-item .value.red {
  color: #f56c6c;
}

.cabin-diagram-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.cabin-diagram-section h4 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 15px;
}

.verification-warnings {
  margin-top: 16px;
  padding: 16px;
  background: #fef0f0;
  border-radius: 4px;
}
</style>
