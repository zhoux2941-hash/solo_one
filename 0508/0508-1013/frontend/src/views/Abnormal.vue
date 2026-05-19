<template>
  <div class="abnormal-page">
    <el-card class="stats-card">
      <div class="stats-grid">
        <el-statistic title="异常总数" :value="abnormalStats.total" class="stat-total">
          <template #suffix>次</template>
        </el-statistic>
        <el-statistic title="体温过高" :value="abnormalStats.high" class="stat-high">
          <template #suffix>次</template>
        </el-statistic>
        <el-statistic title="体温过低" :value="abnormalStats.low" class="stat-low">
          <template #suffix>次</template>
        </el-statistic>
        <el-statistic title="快速上升" :value="abnormalStats.rapid" class="stat-rapid">
          <template #suffix>次</template>
        </el-statistic>
      </div>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>异常告警记录</span>
          <el-button type="primary" @click="loadAbnormalRecords" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="abnormalRecords" stripe style="width: 100%">
        <el-table-column prop="bedNo" label="床位号" width="100">
          <template #default="{ row }">
            {{ row.bedNo }}号床
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="体温(℃)" width="120">
          <template #default="{ row }">
            <span class="text-abnormal">{{ row.temperature.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="recordTime" label="记录时间" width="200">
          <template #default="{ row }">
            {{ formatTime(row.recordTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="abnormalType" label="异常类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getAbnormalTagType(row.abnormalType)" size="small">
              {{ getAbnormalTypeText(row.abnormalType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abnormalMessage" label="异常说明" />
      </el-table>
      <el-empty v-if="abnormalRecords.length === 0" description="暂无异常记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAbnormalRecords } from '../api'

const loading = ref(false)
const abnormalRecords = ref([])

const abnormalStats = reactive({
  total: 0,
  high: 0,
  low: 0,
  rapid: 0
})

const formatTime = (time) => {
  if (!time) return '--'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { hour12: false })
}

const getAbnormalTypeText = (type) => {
  const typeMap = {
    'LOW_TEMPERATURE': '体温过低',
    'HIGH_TEMPERATURE': '体温过高',
    'RAPID_RISE': '快速上升'
  }
  return typeMap[type] || '未知'
}

const getAbnormalTagType = (type) => {
  const typeMap = {
    'LOW_TEMPERATURE': 'info',
    'HIGH_TEMPERATURE': 'danger',
    'RAPID_RISE': 'warning'
  }
  return typeMap[type] || 'info'
}

const loadAbnormalRecords = async () => {
  loading.value = true
  try {
    const res = await getAbnormalRecords()
    abnormalRecords.value = res.data || []
    
    abnormalStats.total = abnormalRecords.value.length
    abnormalStats.high = abnormalRecords.value.filter(r => r.abnormalType === 'HIGH_TEMPERATURE').length
    abnormalStats.low = abnormalRecords.value.filter(r => r.abnormalType === 'LOW_TEMPERATURE').length
    abnormalStats.rapid = abnormalRecords.value.filter(r => r.abnormalType === 'RAPID_RISE').length
  } catch (e) {
    console.error('加载异常记录失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAbnormalRecords()
})
</script>

<style scoped>
.abnormal-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-card,
.table-card {
  border: none;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-total :deep(.el-statistic__number) {
  color: #f56c6c;
}

.stat-high :deep(.el-statistic__number) {
  color: #e6a23c;
}

.stat-low :deep(.el-statistic__number) {
  color: #409eff;
}

.stat-rapid :deep(.el-statistic__number) {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-abnormal {
  color: #f56c6c;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
