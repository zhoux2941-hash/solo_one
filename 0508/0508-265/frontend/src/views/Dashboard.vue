<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon device-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.devicesTotal }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon fault-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.devicesFault }}</div>
              <div class="stat-label">故障设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon order-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.ordersTotal }}</div>
              <div class="stat-label">工单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.ordersPending }}</div>
              <div class="stat-label">待处理工单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新工单</span>
              <el-button type="primary" size="small" @click="$router.push('/workorders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="orderNo" label="工单号" width="140" />
            <el-table-column prop="title" label="工单标题" />
            <el-table-column prop="deviceName" label="设备名称" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新告警</span>
              <el-button type="primary" size="small" @click="$router.push('/alerts')">查看全部</el-button>
            </div>
          </template>
          <div class="alert-list">
            <div v-for="alert in recentAlerts" :key="alert.id" class="alert-item">
              <el-tag :type="getAlertType(alert.level)" size="small" class="alert-tag">
                {{ alert.level }}
              </el-tag>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-time">{{ formatTime(alert.alertTime) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div class="device-status">
            <div v-for="device in devices" :key="device.id" class="device-item">
              <span 
                class="device-status-dot"
                :style="{ backgroundColor: device.status === 'FAULT' ? '#f56c6c' : device.status === 'NORMAL' ? '#67c23a' : '#e6a23c' }"
              ></span>
              <span>{{ device.deviceName }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { deviceApi, workOrderApi, alertApi } from '../api'
import { Monitor, Warning, Document, Timer } from '@element-plus/icons-vue'

const stats = ref({
  devicesTotal: 0,
  devicesFault: 0,
  ordersTotal: 0,
  ordersPending: 0
})

const recentOrders = ref([])
const recentAlerts = ref([])
const devices = ref([])

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'APPROVING': 'primary',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'REJECTED': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待审批',
    'APPROVING': '审批中',
    'IN_PROGRESS': '处理中',
    'COMPLETED': '已完成',
    'REJECTED': '已驳回'
  }
  return map[status] || status
}

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

const loadData = async () => {
  const [devicesData, ordersData, alertsData] = await Promise.all([
    deviceApi.getAll(),
    workOrderApi.getAll(),
    alertApi.getLatest()
  ])
  
  devices.value = devicesData
  recentOrders.value = ordersData.slice(0, 5)
  recentAlerts.value = alertsData
  
  stats.value.devicesTotal = devicesData.length
  stats.value.devicesFault = devicesData.filter(d => d.status === 'FAULT').length
  stats.value.ordersTotal = ordersData.length
  stats.value.ordersPending = ordersData.filter(o => 
    ['PENDING', 'APPROVING', 'IN_PROGRESS'].includes(o.status)
  ).length
}

onMounted(() => {
  loadData()
})
</script>



<style scoped>
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.device-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.fault-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.order-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-tag {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #999;
}

.device-status {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
}

.device-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
