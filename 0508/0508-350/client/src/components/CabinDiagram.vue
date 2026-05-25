<template>
  <div class="cabin-diagram">
    <div class="cabin-blocks-layout">
      <div
        v-for="cabin in localCabins"
        :key="cabin.cabinId"
        class="cabin-block"
      >
        <div class="cabin-block-header">
          <span class="cabin-block-name">{{ cabin.cabinName }}</span>
          <span class="cabin-block-tank">{{ cabin.tankNo }}</span>
        </div>
        
        <div class="cabin-block-body">
          <div class="position-tag">{{ cabin.position }}</div>
          
          <div class="amount-section">
            <div class="amount-row">
              <span class="amount-label">分配量</span>
              <el-input-number
                v-if="editable"
                v-model="cabin.allocatedAmount"
                :min="0"
                :step="0.5"
                :precision="2"
                size="small"
                style="width: 100px"
                @change="handleAmountChange"
              />
              <span v-else class="amount-value allocated">{{ cabin.allocatedAmount.toFixed(2) }} 吨</span>
            </div>
            
            <div v-if="getReceiptCabin(cabin.cabinId)" class="amount-row">
              <span class="amount-label">实装量</span>
              <span class="amount-value loaded">{{ getReceiptCabin(cabin.cabinId)!.loadedAmount.toFixed(2) }} 吨</span>
            </div>
            
            <div v-if="getReceiptCabin(cabin.cabinId)" class="discrepancy-row">
              <span class="discrepancy-label">差值</span>
              <span 
                class="discrepancy-value"
                :class="getDiscrepancyClass(getReceiptCabin(cabin.cabinId)!.discrepancy)"
              >
                {{ getReceiptCabin(cabin.cabinId)!.discrepancy > 0 ? '+' : '' }}{{ getReceiptCabin(cabin.cabinId)!.discrepancy.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <div class="fill-bar">
          <div 
            class="fill-level"
            :style="{ width: getFillPercentage(cabin) + '%' }"
            :class="getFillClass(cabin)"
          ></div>
        </div>
      </div>
    </div>

    <div v-if="editable && hasChanges" class="diagram-actions">
      <el-button size="small" @click="resetChanges">重置</el-button>
      <el-button type="primary" size="small" @click="saveChanges">保存修改</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { AllocatedCabin, LoadedCabin } from '../types'

const props = defineProps<{
  cabins: AllocatedCabin[]
  receiptCabins: LoadedCabin[]
  editable?: boolean
}>()

const emit = defineEmits<{
  'update:cabins': [cabins: AllocatedCabin[]]
}>()

const localCabins = ref<AllocatedCabin[]>([])
const originalCabins = ref<AllocatedCabin[]>([])

watch(() => props.cabins, (newVal) => {
  localCabins.value = JSON.parse(JSON.stringify(newVal))
  originalCabins.value = JSON.parse(JSON.stringify(newVal))
}, { immediate: true, deep: true })

const hasChanges = computed(() => {
  return JSON.stringify(localCabins.value) !== JSON.stringify(originalCabins.value)
})

const getReceiptCabin = (cabinId: string): LoadedCabin | undefined => {
  return props.receiptCabins.find(c => c.cabinId === cabinId)
}

const getFillPercentage = (cabin: AllocatedCabin): number => {
  const receiptCabin = getReceiptCabin(cabin.cabinId)
  if (!receiptCabin || cabin.allocatedAmount === 0) return 0
  return Math.min((receiptCabin.loadedAmount / cabin.allocatedAmount) * 100, 100)
}

const getFillClass = (cabin: AllocatedCabin): string => {
  const percentage = getFillPercentage(cabin)
  if (percentage >= 95) return 'full'
  if (percentage >= 80) return 'high'
  if (percentage >= 50) return 'medium'
  return 'low'
}

const getDiscrepancyClass = (discrepancy: number): string => {
  if (discrepancy > 0.5) return 'over'
  if (discrepancy < -0.5) return 'under'
  return 'normal'
}

const handleAmountChange = () => {
  emit('update:cabins', localCabins.value)
}

const resetChanges = () => {
  localCabins.value = JSON.parse(JSON.stringify(originalCabins.value))
  emit('update:cabins', localCabins.value)
}

const saveChanges = () => {
  originalCabins.value = JSON.parse(JSON.stringify(localCabins.value))
  emit('update:cabins', localCabins.value)
}
</script>

<style scoped>
.cabin-diagram {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.cabin-blocks-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.cabin-block {
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.cabin-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cabin-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.cabin-block-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.cabin-block-tank {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.cabin-block-body {
  margin-bottom: 12px;
}

.position-tag {
  display: inline-block;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 3px;
  margin-bottom: 12px;
}

.amount-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 12px;
  color: #909399;
}

.amount-value {
  font-weight: 600;
  font-size: 14px;
}

.amount-value.allocated {
  color: #67c23a;
}

.amount-value.loaded {
  color: #409eff;
}

.discrepancy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
  margin-top: 8px;
}

.discrepancy-label {
  font-size: 12px;
  color: #909399;
}

.discrepancy-value {
  font-weight: 600;
  font-size: 13px;
}

.discrepancy-value.over {
  color: #e6a23c;
}

.discrepancy-value.under {
  color: #f56c6c;
}

.discrepancy-value.normal {
  color: #67c23a;
}

.fill-bar {
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.fill-level {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.fill-level.low {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.fill-level.medium {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.fill-level.high {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.fill-level.full {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.diagram-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
