<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="40" color="#409EFF"><Car /></el-icon>
            <div class="stat-text">
              <h3>{{ parkingCount }}</h3>
              <p>在场车辆</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="40" color="#67C23A"><Grid /></el-icon>
            <div class="stat-text">
              <h3>{{ availableSpaces }}</h3>
              <p>可用车位</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="40" color="#E6A23C"><Tickets /></el-icon>
            <div class="stat-text">
              <h3>{{ todayOrders }}</h3>
              <p>今日订单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="40" color="#F56C6C"><Money /></el-icon>
            <div class="stat-text">
              <h3>¥{{ todayRevenue }}</h3>
              <p>今日营收</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <span>
              <el-icon size="16" color="#409EFF"><Bell /></el-icon>
              实时动态
            </span>
          </template>
          <div class="activity-list">
            <div v-for="item in activities" :key="item.id" class="activity-item">
              <el-tag :type="item.type === 'entry' ? 'success' : 'danger'" size="small">
                {{ item.type === 'entry' ? '入场' : '离场' }}
              </el-tag>
              <span class="plate">{{ item.plate }}</span>
              <span class="time">{{ item.time }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <span>
              <el-icon size="16" color="#E6A23C"><Van /></el-icon>
              在场车辆
            </span>
          </template>
          <el-table :data="parkingVehicles" size="small">
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="entryTime" label="入场时间" />
            <el-table-column prop="spaceId" label="车位号" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const parkingCount = ref(0)
const availableSpaces = ref(0)
const todayOrders = ref(0)
const todayRevenue = ref('0.00')
const parkingVehicles = ref([])
const activities = ref([
  { id: 1, type: 'entry', plate: '京A12345', time: '10:30:00' },
  { id: 2, type: 'exit', plate: '沪B67890', time: '10:25:00' },
  { id: 3, type: 'entry', plate: '粤C11111', time: '10:20:00' }
])

const loadStatistics = async () => {
  const res = await request.get('/parking/statistics/dashboard')
  if (res.code === 200) {
    parkingCount.value = res.data.currentParkingVehicles || 0
    todayOrders.value = res.data.todayOrders || 0
    todayRevenue.value = res.data.todayRevenue || '0.00'
    if (res.data.parkingLotStats && res.data.parkingLotStats.length > 0) {
      availableSpaces.value = res.data.parkingLotStats[0].availableSpaces || 0
    }
  }
}

const loadVehicles = async () => {
  const res = await request.get('/parking/vehicles/1')
  if (res.code === 200) {
    parkingVehicles.value = res.data || []
  }
}

onMounted(() => {
  loadStatistics()
  loadVehicles()
  
  window.addEventListener('vehicle-entry', () => {
    loadStatistics()
    loadVehicles()
  })
  window.addEventListener('vehicle-exit', () => {
    loadStatistics()
    loadVehicles()
  })
})
</script>

<style scoped>
.stat-card {
  background: #16213e !important;
  border: 1px solid #0f3460 !important;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-text h3 {
  margin: 0;
  font-size: 28px;
  color: #fff;
}

.stat-text p {
  margin: 5px 0 0 0;
  color: #999;
  font-size: 14px;
}

.list-card {
  background: #16213e !important;
  border: 1px solid #0f3460 !important;
}

.list-card :deep(.el-card__header) {
  border-bottom: 1px solid #0f3460;
  color: #fff;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #0f3460;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item .plate {
  color: #409EFF;
  font-weight: bold;
}

.activity-item .time {
  color: #999;
  margin-left: auto;
}

:deep(.el-table) {
  background: transparent;
}

:deep(.el-table th) {
  background: #0f3460 !important;
  color: #fff;
}

:deep(.el-table td) {
  background: #16213e !important;
  color: #ccc;
}
</style>
