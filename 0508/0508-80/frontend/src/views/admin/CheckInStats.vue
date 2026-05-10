<template>
  <div class="checkin-stats">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon success"><User /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ totalStats.totalCheckedIn }}</div>
              <div class="stat-label">已签到人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon primary"><Postcard /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ totalStats.totalAssigned }}</div>
              <div class="stat-label">已分配人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon warning"><Location /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ totalStats.totalPositions }}</div>
              <div class="stat-label">岗位数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon info"><TrendCharts /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ totalStats.overallRate }}%</div>
              <div class="stat-label">整体签到率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>各岗位签到统计</span>
          <div>
            <span v-if="lastUpdateTime" class="update-time">
              最后更新: {{ formatTime() }}
            </span>
            <el-switch 
              v-model="autoRefresh" 
              active-text="自动刷新"
              inline-prompt
              style="margin: 0 16px;"
            />
            <el-button type="primary" @click="refreshData" :loading="refreshing">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
            <el-button type="success" @click="exportExcel" style="margin-left: 8px;">
              <el-icon><Download /></el-icon>
              导出排班表
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="stats" stripe v-loading="loading">
        <el-table-column prop="positionName" label="岗位名称" width="200" />
        <el-table-column prop="positionType" label="类型" width="100">
          <template #default="{ row }">
            {{ getPositionTypeLabel(row.positionType) }}
          </template>
        </el-table-column>
        <el-table-column label="需求人数" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.requiredCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已分配人数" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.currentCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已签到人数" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.checkedInCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到率" width="180">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.checkInRate" 
              :stroke-width="12"
              :color="getRateColor(row.checkInRate)"
              :format="() => `${row.checkInRate.toFixed(1)}%`"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.checkedInCount >= row.currentCount && row.currentCount > 0" type="success">
              已全员签到
            </el-tag>
            <el-tag v-else-if="row.checkedInCount > 0" type="warning">
              部分签到
            </el-tag>
            <el-tag v-else type="info">
              未签到
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElSwitch } from 'element-plus'
import api from '@/utils/api'
import { getPositionTypeLabel } from '@/utils/constants'

const stats = ref([])
const loading = ref(false)
const refreshing = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref(10)
const timer = ref(null)
const lastUpdateTime = ref(null)

const totalStats = computed(() => {
  const totalCheckedIn = stats.value.reduce((sum, item) => sum + item.checkedInCount, 0)
  const totalAssigned = stats.value.reduce((sum, item) => sum + item.currentCount, 0)
  const totalPositions = stats.value.length
  const overallRate = totalAssigned > 0 ? (totalCheckedIn / totalAssigned * 100).toFixed(1) : '0'
  
  return {
    totalCheckedIn,
    totalAssigned,
    totalPositions,
    overallRate
  }
})

function getRateColor(rate) {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

async function fetchStats() {
  loading.value = true
  try {
    const response = await api.get('/admin/checkin-stats')
    if (response.data.success) {
      stats.value = response.data.data
      lastUpdateTime.value = Date.now()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  refreshing.value = true
  await fetchStats()
  refreshing.value = false
  ElMessage.success('数据已刷新')
}

function startAutoRefresh() {
  stopAutoRefresh()
  if (autoRefresh.value) {
    timer.value = setInterval(async () => {
      if (!loading.value) {
        await fetchStats()
      }
    }, refreshInterval.value * 1000)
  }
}

function stopAutoRefresh() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
    ElMessage.success(`已开启自动刷新，每${refreshInterval.value}秒刷新一次`)
  } else {
    stopAutoRefresh()
    ElMessage.info('已关闭自动刷新')
  }
})

function formatTime() {
  if (!lastUpdateTime.value) return ''
  const date = new Date(lastUpdateTime.value)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function exportExcel() {
  window.location.href = '/api/admin/export/schedules'
}

onMounted(() => {
  fetchStats().then(() => {
    startAutoRefresh()
  })
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.stat-card {
  height: 120px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 48px;
  margin-right: 16px;
}

.stat-icon.success { color: #67c23a; }
.stat-icon.primary { color: #409eff; }
.stat-icon.warning { color: #e6a23c; }
.stat-icon.info { color: #909399; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-time {
  color: #909399;
  font-size: 13px;
}
</style>
