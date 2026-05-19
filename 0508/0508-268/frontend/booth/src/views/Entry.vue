<template>
  <div class="entry">
    <el-card>
      <template #header>
        <span>
          <el-icon size="18" color="#67C23A"><ArrowDown /></el-icon>
          车辆入场登记
        </span>
      </template>
      
      <el-form :model="form" label-width="100px" size="large">
        <el-form-item label="车牌号">
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号" style="width: 300px" />
          <el-button type="primary" @click="recognizePlate" style="margin-left: 10px">
            <el-icon><Camera /></el-icon>
            车牌识别
          </el-button>
        </el-form-item>
        
        <el-form-item label="选择车场">
          <el-select v-model="form.parkingLotId" placeholder="请选择车场" style="width: 300px">
            <el-option v-for="lot in parkingLots" :key="lot.id" :label="lot.name" :value="lot.id" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="车位号">
          <el-select v-model="form.spaceId" placeholder="请选择车位" style="width: 300px">
            <el-option v-for="space in availableSpaces" :key="space.id" :label="space.spaceNo" :value="space.id" />
          </el-select>
          <span style="color: #999; margin-left: 10px">可选（路侧停车可不填）</span>
        </el-form-item>
        
        <el-form-item label="车辆类型">
          <el-radio-group v-model="form.vehicleType">
            <el-radio label="普通">普通</el-radio>
            <el-radio label="新能源">新能源</el-radio>
            <el-radio label="军警">军警</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" style="width: 400px" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" @click="confirmEntry">
            <el-icon><Check /></el-icon>
            确认入场
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>最近入场记录</span>
      </template>
      <el-table :data="recentEntries" size="small">
        <el-table-column prop="plateNumber" label="车牌号" width="120">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.plateNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parkingLotId" label="车场ID" width="80" />
        <el-table-column prop="spaceId" label="车位号" width="80" />
        <el-table-column prop="entryTime" label="入场时间" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small">已入场</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const form = reactive({
  plateNumber: '',
  parkingLotId: 1,
  spaceId: null,
  vehicleType: '普通',
  remark: ''
})

const parkingLots = ref([])
const availableSpaces = ref([])
const recentEntries = ref([])

const loadParkingLots = async () => {
  const res = await request.get('/parking/lots')
  if (res.code === 200) {
    parkingLots.value = res.data
  }
}

const loadAvailableSpaces = async () => {
  if (!form.parkingLotId) return
  const res = await request.get(`/parking/spaces/${form.parkingLotId}`)
  if (res.code === 200) {
    availableSpaces.value = res.data.filter(s => s.status === 'AVAILABLE')
  }
}

const recognizePlate = () => {
  ElMessageBox.prompt('模拟车牌识别，请输入车牌号', '车牌识别', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '车牌号不能为空'
  }).then(({ value }) => {
    form.plateNumber = value.toUpperCase()
    ElMessage.success('识别成功')
  }).catch(() => {})
}

const confirmEntry = async () => {
  if (!form.plateNumber) {
    ElMessage.warning('请输入车牌号')
    return
  }
  
  try {
    const res = await request.post('/parking/entry', null, {
      params: {
        parkingLotId: form.parkingLotId,
        spaceId: form.spaceId,
        plateNumber: form.plateNumber
      }
    })
    
    if (res.code === 200) {
      ElMessage.success('入场成功')
      recentEntries.value.unshift({
        plateNumber: form.plateNumber,
        parkingLotId: form.parkingLotId,
        spaceId: form.spaceId,
        entryTime: new Date().toLocaleString(),
        status: '已入场'
      })
      resetForm()
    }
  } catch (error) {
    ElMessage.error('入场失败: ' + (error.response?.data?.message || error.message))
  }
}

const resetForm = () => {
  form.plateNumber = ''
  form.spaceId = null
  form.remark = ''
}

onMounted(() => {
  loadParkingLots()
  loadAvailableSpaces()
})
</script>

<style scoped>
.entry {
  max-width: 800px;
}

:deep(.el-card) {
  background: #16213e;
  border: 1px solid #0f3460;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #0f3460;
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #ccc;
}
</style>
