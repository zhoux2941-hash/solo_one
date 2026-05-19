<template>
  <div class="alerts">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警消息</span>
          <el-badge :value="unreadCount" class="badge">
            <span>未读消息</span>
          </el-badge>
        </div>
      </template>

      <el-table :data="alerts" style="width: 100%">
        <el-table-column label="级别" width="100">
          <template #default="scope">
            <el-tag :type="getAlertType(scope.row.level)" size="small">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="title" label="告警标题" />
        <el-table-column prop="content" label="告警内容" />
        <el-table-column label="是否生成工单" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.workOrderId" type="success">已生成</el-tag>
            <el-tag v-else type="info">未生成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.readFlag ? 'info' : 'warning'" size="small">
              {{ scope.row.readFlag ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alertTime" label="告警时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.alertTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              v-if="!scope.row.readFlag" 
              size="small" 
              @click="markAsRead(scope.row.id)"
            >
              标记已读
            </el-button>
            <el-button 
              v-if="!scope.row.workOrderId" 
              size="small" 
              type="primary" 
              @click="createWorkOrder(scope.row.id)"
            >
              生成工单
            </el-button>
            <el-button 
              v-if="scope.row.workOrderId" 
              size="small" 
              @click="$router.push(`/workorder-detail/${scope.row.workOrderId}`)"
            >
              查看工单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { alertApi, workOrderApi } from '../api'
import { useAlertStore } from '../store'
import { ElMessage } from 'element-plus'

const alertStore = useAlertStore()
const alerts = ref([])

const unreadCount = computed(() => alertStore.unreadCount)

const getAlertType = (level) => {
  const map = {
    'INFO': 'info',
    'WARNING': 'warning',
    'ERROR': 'danger'
  }
  return map[level] || 'info'
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const markAsRead = async (id) => {
  try {
    await alertApi.markAsRead(id)
    alertStore.markAsRead(id)
    const alert = alerts.value.find(a => a.id === id)
    if (alert) alert.readFlag = true
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const createWorkOrder = async (alertId) => {
  try {
    const order = await workOrderApi.createFromAlert(alertId)
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) alert.workOrderId = order.id
    ElMessage.success('工单已生成')
  } catch (error) {
    ElMessage.error('生成失败')
  }
}

const loadData = async () => {
  alerts.value = await alertApi.getAll()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  margin-right: 10px;
}
</style>
