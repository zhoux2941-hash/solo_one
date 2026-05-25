<template>
  <div class="allocation-card">
    <div class="card-header">
      <el-icon color="#67c23a"><Box /></el-icon>
      <span class="card-title">舱位分配</span>
      <el-button
        type="primary"
        size="small"
        @click="handleEdit"
        style="margin-left: auto"
      >
        编辑
      </el-button>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">分配时间</span>
        <span class="value">{{ formatTime(allocation.allocationTime) }}</span>
      </div>
      <div class="info-row">
        <span class="label">操作员</span>
        <span class="value">{{ allocation.operator }}</span>
      </div>
      <div class="info-row">
        <span class="label">总分配量</span>
        <span class="value highlight">{{ allocation.totalAllocatedAmount.toFixed(2) }} 吨</span>
      </div>
      
      <div class="cabin-list">
        <div class="cabin-title">分配舱位</div>
        <div
          v-for="cabin in editingCabins"
          :key="cabin.cabinId"
          class="cabin-item"
        >
          <div class="cabin-header">
            <span class="cabin-name">{{ cabin.cabinName }}</span>
            <span class="tank-no">{{ cabin.tankNo }}</span>
          </div>
          <div v-if="isEditing" class="cabin-edit">
            <el-input-number
              v-model="cabin.allocatedAmount"
              :min="0"
              :step="0.5"
              :precision="2"
              size="small"
              style="width: 100%"
              @change="handleCabinChange"
            />
          </div>
          <div v-else class="cabin-info">
            <span class="position">{{ cabin.position }}</span>
            <span class="amount">{{ cabin.allocatedAmount.toFixed(2) }} 吨</span>
          </div>
        </div>
      </div>

      <div v-if="isEditing" class="action-buttons">
        <el-button size="small" @click="isEditing = false">取消</el-button>
        <el-button type="primary" size="small" @click="handleSave">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Box } from '@element-plus/icons-vue'
import type { CabinAllocation, AllocatedCabin } from '../types'

const props = defineProps<{
  allocation: CabinAllocation
  applicationId: string
}>()

const emit = defineEmits<{
  'update:allocation': [allocationId: string, cabins: AllocatedCabin[]]
}>()

const isEditing = ref(false)
const editingCabins = ref<AllocatedCabin[]>([])

watch(() => props.allocation, (newVal) => {
  if (newVal) {
    editingCabins.value = JSON.parse(JSON.stringify(newVal.cabins))
  }
}, { immediate: true, deep: true })

const handleEdit = () => {
  editingCabins.value = JSON.parse(JSON.stringify(props.allocation.cabins))
  isEditing.value = true
}

const handleCabinChange = () => {
}

const handleSave = () => {
  emit('update:allocation', props.allocation.id, editingCabins.value)
  isEditing.value = false
}

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
.allocation-card {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-radius: 8px;
  border: 1px solid #b3e19d;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #b3e19d;
  background: rgba(103, 194, 58, 0.1);
  border-radius: 8px 8px 0 0;
}

.card-title {
  font-weight: 600;
  color: #67c23a;
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
  color: #67c23a;
  font-weight: 600;
}

.cabin-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #b3e19d;
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
}

.cabin-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
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

.cabin-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.position {
  color: #606266;
}

.amount {
  color: #67c23a;
  font-weight: 600;
}

.cabin-edit {
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
