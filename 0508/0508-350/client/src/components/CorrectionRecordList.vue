<template>
  <div class="correction-record-list">
    <el-table :data="records" border stripe>
      <el-table-column label="修正时间" width="180">
        <template #default="{ row }">
          <span class="time-text">{{ formatTime(row.correctionTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="shipName" label="渔船" width="120" />
      <el-table-column prop="cabinName" label="舱位" width="100" />
      <el-table-column label="数量调整" width="200">
        <template #default="{ row }">
          <span class="amount-change">
            <span class="old">{{ row.oldAmount.toFixed(2) }}</span>
            <el-icon class="arrow" color="#409eff"><Right /></el-icon>
            <span 
              class="new"
              :class="{
                increase: row.newAmount > row.oldAmount,
                decrease: row.newAmount < row.oldAmount
              }"
            >
              {{ row.newAmount.toFixed(2) }}
            </span>
            <span class="diff">
              ({{ row.newAmount > row.oldAmount ? '+' : '' }}{{ (row.newAmount - row.oldAmount).toFixed(2) }})
            </span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="储罐调整" width="150">
        <template #default="{ row }">
          <span v-if="row.oldTankNo !== row.newTankNo" class="tank-change">
            <span class="old-tank">{{ row.oldTankNo }}</span>
            <el-icon class="arrow" color="#e6a23c"><Right /></el-icon>
            <span class="new-tank">{{ row.newTankNo }}</span>
          </span>
          <span v-else class="tank-same">{{ row.oldTankNo }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="operator" label="操作员" width="100" />
      <el-table-column prop="workGroup" label="班组" width="80">
        <template #default="{ row }">
          <el-tag :type="getGroupTagType(row.workGroup)" size="small">
            {{ row.workGroup }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="影响范围" width="150">
        <template #default="{ row }">
          <div class="impact-info">
            <span v-if="row.affectedReceipts.length > 0" class="impact-item">
              <el-icon><Tickets /></el-icon>
              {{ row.affectedReceipts.length }} 回单
            </span>
            <span v-if="row.affectedSettlements.length > 0" class="impact-item">
              <el-icon><Money /></el-icon>
              {{ row.affectedSettlements.length }} 结算
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="修正原因" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.reason" placement="top">
            <span class="reason-text">{{ row.reason }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="records.length === 0" description="暂无修正记录" />

    <el-dialog
      v-model="detailVisible"
      title="修正记录详情"
      width="600px"
    >
      <div v-if="currentRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="修正时间">
            {{ formatFullTime(currentRecord.correctionTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="渔船名称">
            {{ currentRecord.shipName }}
          </el-descriptions-item>
          <el-descriptions-item label="舱位">
            {{ currentRecord.cabinName }}
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ currentRecord.operator }} ({{ currentRecord.workGroup }})
          </el-descriptions-item>
          <el-descriptions-item label="分配量调整" :span="2">
            <span class="detail-amount">
              {{ currentRecord.oldAmount.toFixed(2) }} 吨
              <el-icon color="#409eff"><Right /></el-icon>
              {{ currentRecord.newAmount.toFixed(2) }} 吨
              <el-tag 
                :type="currentRecord.newAmount > currentRecord.oldAmount ? 'success' : 'warning'"
                style="margin-left: 8px"
              >
                {{ currentRecord.newAmount > currentRecord.oldAmount ? '+' : '' }}
                {{ (currentRecord.newAmount - currentRecord.oldAmount).toFixed(2) }} 吨
              </el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="储罐调整" :span="2">
            <span v-if="currentRecord.oldTankNo !== currentRecord.newTankNo" class="detail-tank">
              {{ currentRecord.oldTankNo }}
              <el-icon color="#e6a23c"><Right /></el-icon>
              {{ currentRecord.newTankNo }}
            </span>
            <span v-else>{{ currentRecord.oldTankNo }} (未调整)</span>
          </el-descriptions-item>
          <el-descriptions-item label="影响回单" :span="2">
            <div v-if="currentRecord.affectedReceipts.length > 0" class="affected-list">
              <el-tag
                v-for="id in currentRecord.affectedReceipts"
                :key="id"
                type="warning"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ id }}
              </el-tag>
            </div>
            <span v-else class="no-affect">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="影响结算" :span="2">
            <div v-if="currentRecord.affectedSettlements.length > 0" class="affected-list">
              <el-tag
                v-for="id in currentRecord.affectedSettlements"
                :key="id"
                type="danger"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ id }}
              </el-tag>
            </div>
            <span v-else class="no-affect">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="修正原因" :span="2">
            {{ currentRecord.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="警告信息" :span="2" v-if="currentRecord.warnings.length > 0">
            <div class="warnings-list">
              <el-alert
                v-for="(warning, idx) in currentRecord.warnings"
                :key="idx"
                :title="warning"
                type="warning"
                show-icon
                style="margin-bottom: 8px"
              />
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Right, Tickets, Money } from '@element-plus/icons-vue'
import type { CabinCorrectionRecord } from '../types'

defineProps<{
  records: CabinCorrectionRecord[]
}>()

const detailVisible = ref(false)
const currentRecord = ref<CabinCorrectionRecord | null>(null)

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatFullTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

const getGroupTagType = (group: string) => {
  const typeMap: Record<string, string> = {
    '甲班': 'primary',
    '乙班': 'success',
    '丙班': 'warning'
  }
  return typeMap[group] || 'info'
}

const showDetail = (record: CabinCorrectionRecord) => {
  currentRecord.value = record
  detailVisible.value = true
}
</script>

<style scoped>
.correction-record-list {
  width: 100%;
}

.time-text {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
}

.amount-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}

.amount-change .old {
  color: #909399;
  text-decoration: line-through;
}

.amount-change .new {
  font-weight: 600;
}

.amount-change .new.increase {
  color: #67c23a;
}

.amount-change .new.decrease {
  color: #e6a23c;
}

.amount-change .diff {
  font-size: 12px;
  color: #909399;
}

.amount-change .arrow {
  font-size: 12px;
}

.tank-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}

.tank-change .old-tank {
  color: #909399;
  text-decoration: line-through;
}

.tank-change .new-tank {
  color: #e6a23c;
  font-weight: 600;
}

.tank-change .arrow {
  font-size: 12px;
}

.tank-same {
  color: #909399;
  font-family: monospace;
}

.impact-info {
  display: flex;
  gap: 12px;
}

.impact-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.reason-text {
  color: #606266;
  font-size: 13px;
}

.detail-amount {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  font-size: 14px;
}

.detail-tank {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
}

.affected-list {
  display: flex;
  flex-wrap: wrap;
}

.no-affect {
  color: #909399;
}

.warnings-list {
  width: 100%;
}
</style>
