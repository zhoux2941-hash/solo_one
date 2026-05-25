<template>
  <div class="receipt-card">
    <div class="card-header">
      <el-icon :color="hasAffected ? '#e6a23c' : '#e6a23c'"><Tickets /></el-icon>
      <span class="card-title">装载回单</span>
      <el-badge v-if="hasAffected" :value="affectedCount" type="warning" />
    </div>
    <div class="card-body">
      <div v-if="receipts.length === 0" class="empty-state">
        <el-empty description="暂无回单" :image-size="60" />
      </div>
      
      <div v-else>
        <div class="info-row">
          <span class="label">回单编号</span>
          <span class="value">{{ receipts[0].receiptNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">装载时间</span>
          <span class="value">{{ formatTime(receipts[0].loadingTime) }}</span>
        </div>
        <div class="info-row">
          <span class="label">操作员</span>
          <span class="value">{{ receipts[0].operator }}</span>
        </div>
        <div class="info-row">
          <span class="label">总装载量</span>
          <span class="value highlight">{{ receipts[0].totalLoadedAmount.toFixed(2) }} 吨</span>
        </div>
        
        <div class="cabin-list">
          <div class="cabin-title">装载明细</div>
          <div
            v-for="cabin in receipts[0].cabins"
            :key="cabin.cabinId"
            class="cabin-item"
            :class="{ affected: cabin.isAffected }"
          >
            <div class="cabin-header">
              <span class="cabin-name">
                {{ cabin.cabinName }}
                <el-tag v-if="cabin.isAffected" type="warning" size="small" style="margin-left: 8px">
                  受影响
                </el-tag>
              </span>
              <span class="tank-no">{{ cabin.tankNo }}</span>
            </div>
            <div class="cabin-details">
              <div class="detail-item">
                <span class="detail-label">分配量</span>
                <span class="detail-value">{{ cabin.allocatedAmount.toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">实装量</span>
                <span class="detail-value loaded">{{ cabin.loadedAmount.toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">差值</span>
                <span class="detail-value" :class="getDiscrepancyClass(cabin.discrepancy)">
                  {{ cabin.discrepancy > 0 ? '+' : '' }}{{ cabin.discrepancy.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tickets } from '@element-plus/icons-vue'
import type { LoadingReceipt } from '../types'

const props = defineProps<{
  receipts: LoadingReceipt[]
  affectedReceipts: string[]
}>()

const hasAffected = computed(() => {
  return props.receipts.some(r => 
    props.affectedReceipts.includes(r.id) || r.cabins.some(c => c.isAffected)
  )
})

const affectedCount = computed(() => {
  if (props.receipts.length === 0) return 0
  return props.receipts[0].cabins.filter(c => c.isAffected).length
})

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDiscrepancyClass = (discrepancy: number) => {
  if (discrepancy > 0.5) return 'positive'
  if (discrepancy < -0.5) return 'negative'
  return ''
}
</script>

<style scoped>
.receipt-card {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-radius: 8px;
  border: 1px solid #f5dab1;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f5dab1;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 8px 8px 0 0;
}

.card-title {
  font-weight: 600;
  color: #e6a23c;
  font-size: 14px;
}

.card-body {
  padding: 16px;
}

.empty-state {
  padding: 20px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}

.label {
  color: #606266;
}

.value {
  color: #303133;
  font-weight: 500;
}

.value.highlight {
  color: #e6a23c;
  font-weight: 600;
}

.cabin-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #f5dab1;
}

.cabin-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.cabin-item {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.cabin-item.affected {
  background: rgba(230, 162, 60, 0.2);
  border: 1px solid #e6a23c;
}

.cabin-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: center;
}

.cabin-name {
  font-weight: 500;
  color: #303133;
}

.tank-no {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.cabin-details {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.detail-item {
  text-align: center;
  flex: 1;
}

.detail-label {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.detail-value {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.detail-value.loaded {
  color: #67c23a;
}

.detail-value.positive {
  color: #e6a23c;
}

.detail-value.negative {
  color: #f56c6c;
}
</style>
