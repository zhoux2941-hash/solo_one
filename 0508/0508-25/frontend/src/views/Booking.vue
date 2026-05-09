<template>
  <div class="page-container">
    <div class="page-title">📅 预约管理</div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable style="width: 100%" @change="loadBookings">
          <el-option label="待确认" value="PENDING" />
          <el-option label="已确认" value="CONFIRMED" />
          <el-option label="已取消" value="CANCELLED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>
      </el-col>
    </el-row>

    <el-table :data="bookings" v-loading="loading" stripe class="card-shadow">
      <el-table-column prop="bookingId" label="预约ID" width="100" />
      <el-table-column label="宠物" width="150">
        <template #default="{ row }">
          {{ getPetName(row.petId) }}
        </template>
      </el-table-column>
      <el-table-column label="房间" width="200">
        <template #default="{ row }">
          {{ getRoomName(row.roomId) }}
        </template>
      </el-table-column>
      <el-table-column label="时间" width="280">
        <template #default="{ row }">
          <span>{{ row.startDate }} 至 {{ row.endDate }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalPrice" label="价格" width="100">
        <template #default="{ row }">
          ¥{{ row.totalPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <span :class="['status-tag', `status-${row.status.toLowerCase()}`]">
            {{ statusMap[row.status] }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="specialRequirements" label="特殊要求" min-width="150">
        <template #default="{ row }">
          {{ row.specialRequirements || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'PENDING'"
            size="small"
            type="success"
            link
            @click="handleConfirm(row)"
          >
            确认
          </el-button>
          <el-button
            v-if="row.status === 'PENDING'"
            size="small"
            type="danger"
            link
            @click="handleReject(row)"
          >
            拒绝
          </el-button>
          <el-button
            v-if="row.status === 'CONFIRMED' || row.status === 'PENDING'"
            size="small"
            type="warning"
            link
            @click="handleCancel(row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bookingApi, petApi, centerApi } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const bookings = ref([])
const pets = ref([])
const rooms = ref([])
const loading = ref(false)
const filterStatus = ref('')

const statusMap = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  CANCELLED: '已取消',
  REJECTED: '已拒绝',
  COMPLETED: '已完成'
}

const filteredBookings = computed(() => {
  if (!filterStatus.value) return bookings.value
  return bookings.value.filter(b => b.status === filterStatus.value)
})

const getPetName = (petId) => {
  const pet = pets.value.find(p => p.petId === petId)
  return pet ? pet.name : `宠物#${petId}`
}

const getRoomName = (roomId) => {
  const room = rooms.value.find(r => r.roomId === roomId)
  return room ? room.name : `房间#${roomId}`
}

const loadBookings = async () => {
  loading.value = true
  try {
    bookings.value = await bookingApi.getList({ ownerId: appStore.currentOwnerId })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadPets = async () => {
  try {
    pets.value = await petApi.getByOwner(appStore.currentOwnerId)
  } catch (e) {
    console.error(e)
  }
}

const loadRooms = async () => {
  try {
    rooms.value = await centerApi.getAllRooms()
  } catch (e) {
    console.error(e)
  }
}

const handleConfirm = async (row) => {
  try {
    await bookingApi.confirm(row.bookingId)
    ElMessage.success('预约已确认')
    loadBookings()
  } catch (e) {
    ElMessage.error('确认失败')
  }
}

const handleCancel = async (row) => {
  ElMessageBox.confirm('确定要取消此预约吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await bookingApi.cancel(row.bookingId)
    ElMessage.success('预约已取消')
    loadBookings()
  }).catch(() => {})
}

const handleReject = async (row) => {
  const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝预约', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /\S/,
    inputErrorMessage: '请输入拒绝原因'
  }).catch(() => null)
  
  if (reason) {
    await bookingApi.reject(row.bookingId, reason)
    ElMessage.success('预约已拒绝')
    loadBookings()
  }
}

onMounted(() => {
  loadBookings()
  loadPets()
  loadRooms()
})
</script>
