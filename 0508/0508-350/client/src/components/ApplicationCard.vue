<template>
  <div class="application-card">
    <div class="card-header">
      <el-icon color="#409eff"><Document /></el-icon>
      <span class="card-title">加冰申请</span>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">申请单号</span>
        <span class="value">{{ application.applicationNo }}</span>
      </div>
      <div class="info-row">
        <span class="label">渔船名称</span>
        <span class="value">{{ application.shipName }}</span>
      </div>
      <div class="info-row">
        <span class="label">申请时间</span>
        <span class="value">{{ formatTime(application.applyTime) }}</span>
      </div>
      <div class="info-row">
        <span class="label">计划加冰量</span>
        <span class="value highlight">{{ application.plannedIceAmount.toFixed(2) }} 吨</span>
      </div>
      
      <div class="cabin-list">
        <div class="cabin-title">申请舱位</div>
        <div
          v-for="cabin in application.cabinRequests"
          :key="cabin.cabinId"
          class="cabin-item"
        >
          <span class="cabin-name">{{ cabin.cabinName }}</span>
          <span class="cabin-amount">{{ cabin.requestedAmount.toFixed(2) }} 吨</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import type { IceApplication } from '../types'

defineProps<{
  application: IceApplication
}>()

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.application-card {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-radius: 8px;
  border: 1px solid #a0cfff;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #a0cfff;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px 8px 0 0;
}

.card-title {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.card-body {
  padding: 16px;
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
  color: #409eff;
  font-weight: 600;
}

.cabin-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #a0cfff;
}

.cabin-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.cabin-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 13px;
}

.cabin-name {
  color: #606266;
}

.cabin-amount {
  color: #409eff;
  font-weight: 500;
}
</style>
