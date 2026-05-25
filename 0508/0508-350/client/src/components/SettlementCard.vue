<template>
  <div class="settlement-card">
    <div class="card-header">
      <el-icon :color="hasAffected ? '#f56c6c' : '#909399'"><Money /></el-icon>
      <span class="card-title">结算预览</span>
      <el-badge v-if="hasAffected" value="受影响" type="danger" />
    </div>
    <div class="card-body">
      <div v-if="settlements.length === 0" class="empty-state">
        <el-empty description="暂无结算" :image-size="60" />
      </div>
      
      <div v-else>
        <div class="info-row">
          <span class="label">结算日期</span>
          <span class="value">{{ settlements[0].settlementDate }}</span>
        </div>
        <div class="info-row">
          <span class="label">结算单价</span>
          <span class="value">{{ settlements[0].unitPrice.toFixed(2) }} 元/吨</span>
        </div>
        <div class="info-row">
          <span class="label">结算冰量</span>
          <span class="value">{{ settlements[0].totalIceAmount.toFixed(2) }} 吨</span>
        </div>
        <div class="info-row total">
          <span class="label">结算金额</span>
          <span class="value">¥ {{ settlements[0].totalAmount.toFixed(2) }}</span>
        </div>
        
        <div class="cabin-list">
          <div class="cabin-title">结算明细</div>
          <div
            v-for="cabin in settlements[0].cabins"
            :key="cabin.cabinId"
            class="cabin-item"
            :class="{ affected: cabin.isAffected }"
          >
            <div class="cabin-header">
              <span class="cabin-name">
                {{ cabin.cabinName }}
                <el-tag v-if="cabin.isAffected" type="danger" size="small" style="margin-left: 8px">
                  受影响
                </el-tag>
              </span>
            </div>
            <div class="cabin-details">
              <div class="detail-item">
                <span class="detail-label">冰量</span>
                <span class="detail-value">{{ cabin.loadedAmount.toFixed(2) }} 吨</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">单价</span>
                <span class="detail-value">{{ cabin.unitPrice.toFixed(0) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">金额</span>
                <span class="detail-value amount">¥ {{ cabin.amount.toFixed(2) }}</span>
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
import { Money } from '@element-plus/icons-vue'
import type { SettlementPreview } from '../types'

const props = defineProps<{
  settlements: SettlementPreview[]
  affectedSettlements: string[]
}>()

const hasAffected = computed(() => {
  return props.settlements.some(s => 
    props.affectedSettlements.includes(s.id) || s.isAffected
  )
})
</script>

<style scoped>
.settlement-card {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  border-radius: 8px;
  border: 1px solid #d3d4d6;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #d3d4d6;
  background: rgba(144, 147, 153, 0.1);
  border-radius: 8px 8px 0 0;
}

.card-title {
  font-weight: 600;
  color: #606266;
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

.info-row.total {
  padding-top: 8px;
  border-top: 1px dashed #d3d4d6;
}

.info-row.total .label {
  font-weight: 600;
  font-size: 14px;
}

.info-row.total .value {
  font-weight: 700;
  font-size: 16px;
  color: #f56c6c;
}

.label {
  color: #606266;
}

.value {
  color: #303133;
  font-weight: 500;
}

.cabin-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #d3d4d6;
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
  background: rgba(245, 108, 108, 0.15);
  border: 1px solid #f56c6c;
}

.cabin-header {
  margin-bottom: 8px;
}

.cabin-name {
  font-weight: 500;
  color: #303133;
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
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.detail-value.amount {
  color: #f56c6c;
}
</style>
