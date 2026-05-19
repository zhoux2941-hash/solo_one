<template>
  <div class="vehicles">
    <h2>车辆管理</h2>
    
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>在场车辆</span>
          <el-select v-model="selectedLot" placeholder="选择车场" style="width: 200px" @change="loadVehicles">
            <el-option label="全部车场" :value="null" />
            <el-option v-for="lot in parkingLots" :key="lot.id" :label="lot.name" :value="lot.id" />
          </el-select>
        </div>
      </template>
      <el-table :data="vehicles" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="plateNumber" label="车牌号" width="150">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.plateNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parkingLotId" label="车场ID" width="100" />
        <el-table-column prop="spaceId" label="车位ID" width="100" />
        <el-table-column prop="entryTime" label="入场时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success">停车中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" link @click="vehicleExit(row)">离场结算</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const vehicles = ref([])
const parkingLots = ref([])
const selectedLot = ref(null)

const loadParkingLots = async () => {
  const res = await request.get('/parking/lots')
  if (res.code === 200) {
    parkingLots.value = res.data
  }
}

const loadVehicles = async () => {
  const lotId = selectedLot.value || 1
  const res = await request.get(`/parking/vehicles/${lotId}`)
  if (res.code === 200) {
    vehicles.value = res.data
  }
}

const vehicleExit = async (vehicle) => {
  try {
    await ElMessageBox.confirm(
      `确认车辆 ${vehicle.plateNumber} 离场？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await request.post('/parking/exit', null, {
      params: { plateNumber: vehicle.plateNumber }
    })
    
    if (res.code === 200) {
      ElMessage.success(`离场成功，费用: ${res.data.totalAmount} 元`)
      loadVehicles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  loadParkingLots()
  loadVehicles()
  
  window.addEventListener('vehicle-entry', () => {
    loadVehicles()
  })
  window.addEventListener('vehicle-exit', () => {
    loadVehicles()
  })
})
</script>

<style scoped>
.vehicles {
  padding: 20px;
}

.vehicles h2 {
  margin-bottom: 20px;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
