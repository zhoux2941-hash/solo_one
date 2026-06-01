<template>
  <div class="alerts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警筛选</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="filters" @submit.prevent="loadAlerts">
        <el-form-item label="流地址">
          <el-select v-model="filters.streamId" placeholder="选择流" clearable style="width: 200px">
            <el-option v-for="stream in streams" :key="stream.id" :label="stream.name" :value="stream.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警类型">
          <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 150px">
            <el-option label="丢包率过高" value="packet_loss" />
            <el-option label="码率过低" value="low_bitrate" />
            <el-option label="无信号" value="no_signal" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="filters.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="filters.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAlerts">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>告警列表 (共 {{ alerts.length }} 条)</span>
        </div>
      </template>
      
      <el-table :data="alerts" style="width: 100%">
        <el-table-column prop="severity" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            {{ getTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="streamName" label="流名称" width="150" />
        <el-table-column prop="streamAddress" label="流地址" show-overflow-tooltip />
        <el-table-column prop="message" label="告警信息" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="告警时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="acknowledged" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.acknowledged ? 'info' : 'danger'" size="small">
              {{ row.acknowledged ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              @click="acknowledgeAlert(row.id)"
              :disabled="row.acknowledged"
            >
              确认
            </el-button>
            <el-button size="small" type="danger" @click="deleteAlert(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertsApi, streamsApi } from '../api'
import { useAlertStore } from '../stores/alert'

const alertStore = useAlertStore()

const alerts = ref([])
const streams = ref([])
const filters = ref({
  streamId: '',
  type: '',
  startTime: '',
  endTime: ''
})

const loadStreams = async () => {
  try {
    streams.value = await streamsApi.getAll()
  } catch (err) {
    console.error('Load streams error:', err)
  }
}

const loadAlerts = async () => {
  try {
    const params = {}
    if (filters.value.streamId) params.streamId = filters.value.streamId
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.startTime) params.startTime = filters.value.startTime
    if (filters.value.endTime) params.endTime = filters.value.endTime
    
    alerts.value = await alertsApi.getAll(params)
    alertStore.setAlerts(alerts.value)
  } catch (err) {
    ElMessage.error('加载告警列表失败')
  }
}

const resetFilters = () => {
  filters.value = {
    streamId: '',
    type: '',
    startTime: '',
    endTime: ''
  }
  loadAlerts()
}

const getSeverityType = (severity) => {
  const types = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: ''
  }
  return types[severity] || ''
}

const getSeverityLabel = (severity) => {
  const labels = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[severity] || severity
}

const getTypeLabel = (type) => {
  const labels = {
    packet_loss: '丢包率过高',
    low_bitrate: '码率过低',
    no_signal: '无信号'
  }
  return labels[type] || type
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const acknowledgeAlert = async (alertId) => {
  try {
    await alertsApi.acknowledge(alertId)
    alertStore.acknowledgeAlert(alertId)
    ElMessage.success('已确认告警')
    loadAlerts()
  } catch (err) {
    ElMessage.error('确认失败')
  }
}

const deleteAlert = async (alertId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条告警吗？', '确认删除', {
      type: 'warning'
    })
    await alertsApi.delete(alertId)
    alertStore.removeAlert(alertId)
    ElMessage.success('删除成功')
    loadAlerts()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadStreams()
  loadAlerts()
})
</script>

<style scoped>
.alerts-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
