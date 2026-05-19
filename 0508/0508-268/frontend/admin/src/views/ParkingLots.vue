<template>
  <div class="parking-lots">
    <h2>车场管理</h2>
    
    <el-table :data="parkingLots" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="车场名称" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'INDOOR' ? 'success' : 'primary'">
            {{ row.type === 'INDOOR' ? '室内' : '路侧' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="totalSpaces" label="总车位" width="100" />
      <el-table-column prop="availableSpaces" label="可用车位" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="viewSpaces(row)">查看车位</el-button>
          <el-button type="warning" size="small" link @click="editLot(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const parkingLots = ref([])

const loadParkingLots = async () => {
  const res = await request.get('/parking/lots')
  if (res.code === 200) {
    parkingLots.value = res.data
  }
}

const viewSpaces = (lot) => {
  router.push({ path: '/parking-spaces', query: { lotId: lot.id, lotName: lot.name } })
}

const editLot = (lot) => {
  console.log('编辑车场:', lot)
}

onMounted(() => {
  loadParkingLots()
  
  window.addEventListener('space-update', () => {
    loadParkingLots()
  })
})
</script>

<style scoped>
.parking-lots {
  padding: 20px;
}

.parking-lots h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>
