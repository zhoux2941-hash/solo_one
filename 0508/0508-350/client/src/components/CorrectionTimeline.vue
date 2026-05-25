<template>
  <div class="correction-timeline">
    <div v-loading="loading" class="timeline-container">
      <el-timeline>
        <el-timeline-item
          v-for="day in timelineData"
          :key="day.date"
          :timestamp="formatDate(day.date)"
          placement="top"
          size="large"
        >
          <div class="day-summary">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="summary-card total">
                  <div class="summary-icon">
                    <el-icon :size="24"><Edit /></el-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-value">{{ day.totalCorrections }}</div>
                    <div class="summary-label">修正次数</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card receipt">
                  <div class="summary-icon">
                    <el-icon :size="24"><Tickets /></el-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-value">{{ day.affectedReceipts }}</div>
                    <div class="summary-label">影响回单</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card settlement">
                  <div class="summary-icon">
                    <el-icon :size="24"><Money /></el-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-value">{{ day.affectedSettlements }}</div>
                    <div class="summary-label">影响结算</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-card ship">
                  <div class="summary-icon">
                    <el-icon :size="24"><Ship /></el-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-value">{{ getUniqueShips(day.records) }}</div>
                    <div class="summary-label">涉及渔船</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="day-records">
            <el-collapse v-model="expandedRecords">
              <el-collapse-item
                v-for="record in day.records"
                :key="record.id"
                :name="record.id"
              >
                <template #title>
                  <div class="record-title">
                    <el-tag :type="getGroupTagType(record.workGroup)" size="small">
                      {{ record.workGroup }}
                    </el-tag>
                    <span class="record-time">{{ formatTime(record.correctionTime) }}</span>
                    <span class="record-ship">{{ record.shipName }}</span>
                    <span class="record-cabin">{{ record.cabinName }}</span>
                    <span class="record-change">
                      {{ record.oldAmount.toFixed(2) }} → {{ record.newAmount.toFixed(2) }} 吨
                    </span>
                    <el-tag 
                      v-if="record.oldTankNo !== record.newTankNo" 
                      type="warning" 
                      size="small"
                    >
                      {{ record.oldTankNo }} → {{ record.newTankNo }}
                    </el-tag>
                  </div>
                </template>

                <div class="record-detail">
                  <el-descriptions :column="2" size="small" border>
                    <el-descriptions-item label="操作员">
                      {{ record.operator }}
                    </el-descriptions-item>
                    <el-descriptions-item label="修正原因">
                      {{ record.reason }}
                    </el-descriptions-item>
                    <el-descriptions-item label="影响回单" :span="2">
                      <el-tag
                        v-for="id in record.affectedReceipts"
                        :key="id"
                        type="warning"
                        size="small"
                        style="margin-right: 8px"
                      >
                        {{ id }}
                      </el-tag>
                      <span v-if="record.affectedReceipts.length === 0" class="no-affect">无</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="影响结算" :span="2">
                      <el-tag
                        v-for="id in record.affectedSettlements"
                        :key="id"
                        type="danger"
                        size="small"
                        style="margin-right: 8px"
                      >
                        {{ id }}
                      </el-tag>
                      <span v-if="record.affectedSettlements.length === 0" class="no-affect">无</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="警告信息" :span="2" v-if="record.warnings.length > 0">
                      <div class="warnings">
                        <el-alert
                          v-for="(warning, idx) in record.warnings"
                          :key="idx"
                          :title="warning"
                          type="warning"
                          show-icon
                          style="margin-bottom: 4px"
                        />
                      </div>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-if="timelineData.length === 0" description="近两天无修正记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Tickets, Money, Ship } from '@element-plus/icons-vue'
import { correctionApi } from '../api'
import type { CorrectionTimelineDay, CabinCorrectionRecord } from '../types'

const props = defineProps<{
  days?: number
}>()

const loading = ref(false)
const timelineData = ref<CorrectionTimelineDay[]>([])
const expandedRecords = ref<string[]>([])

const loadTimeline = async () => {
  loading.value = true
  try {
    const response = await correctionApi.getTimeline(props.days || 2)
    if (response.data.success) {
      timelineData.value = response.data.data
      if (timelineData.value.length > 0 && timelineData.value[0].records.length > 0) {
        expandedRecords.value = [timelineData.value[0].records[0].id]
      }
    }
  } catch (error) {
    ElMessage.error('加载时间线失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  }
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getUniqueShips = (records: CabinCorrectionRecord[]) => {
  return new Set(records.map(r => r.shipId)).size
}

const getGroupTagType = (group: string) => {
  const typeMap: Record<string, string> = {
    '甲班': 'primary',
    '乙班': 'success',
    '丙班': 'warning'
  }
  return typeMap[group] || 'info'
}

watch(() => props.days, () => {
  loadTimeline()
})

onMounted(() => {
  loadTimeline()
})

defineExpose({
  refresh: loadTimeline
})
</script>

<style scoped>
.correction-timeline {
  width: 100%;
}

.timeline-container {
  padding: 8px 0;
}

.day-summary {
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border: 1px solid #e4e7ed;
}

.summary-card.total {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #a0cfff;
}

.summary-card.total .summary-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.summary-card.receipt {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #f5dab1;
}

.summary-card.receipt .summary-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.summary-card.settlement {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
}

.summary-card.settlement .summary-icon {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.summary-card.ship {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-color: #b3e19d;
}

.summary-card.ship .summary-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.day-records {
  margin-top: 8px;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.record-time {
  font-family: monospace;
  color: #606266;
  font-size: 13px;
}

.record-ship {
  font-weight: 500;
  color: #303133;
}

.record-cabin {
  color: #606266;
}

.record-change {
  font-family: monospace;
  color: #409eff;
  font-weight: 500;
}

.record-detail {
  padding: 8px 0;
}

.no-affect {
  color: #909399;
}

.warnings {
  width: 100%;
}
</style>
