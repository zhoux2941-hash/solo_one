<template>
  <div class="coach-bookings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学员预约</span>
        </div>
      </template>
      <el-table :data="bookings" v-loading="loading" stripe>
        <el-table-column label="学员姓名" prop="student_name" />
        <el-table-column label="联系电话" prop="student_phone" />
        <el-table-column label="日期" prop="booking_date" />
        <el-table-column label="时段" :formatter="formatTime" />
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.is_carpool === 1" type="primary" effect="dark" size="small">
              拼车
            </el-tag>
            <el-tag v-else type="info" size="small">
              独自
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拼车状态" width="120" v-if="hasCarpool">
          <template #default="scope">
            <el-tag
              v-if="scope.row.is_carpool === 1"
              :type="getCarpoolStatusType(scope.row.carpool_status)"
              size="small"
            >
              {{ getCarpoolStatusText(scope.row.carpool_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 1"
              type="success"
              size="small"
              @click="completeBooking(scope.row)"
            >
              完成课程
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !bookings.length" description="暂无预约记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const bookings = ref([])
const loading = ref(false)

const hasCarpool = computed(() => {
  return bookings.value.some(b => b.is_carpool === 1)
})

const loadBookings = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/coach/manage/bookings',
      method: 'get'
    })
    bookings.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const formatTime = (row) => {
  return `${row.start_hour}:00 - ${row.start_hour + 1}:00`
}

const getStatusType = (status) => {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    1: '待上课',
    2: '已完成',
    3: '已取消'
  }
  return textMap[status] || '未知'
}

const getCarpoolStatusType = (status) => {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

const getCarpoolStatusText = (status) => {
  const textMap = {
    1: '等待拼友',
    2: '拼车成功',
    3: '拼车失败'
  }
  return textMap[status] || '未知'
}

const completeBooking = (row) => {
  ElMessageBox.confirm('确认该课程已完成吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await request({
        url: `/coach/manage/bookings/${row.id}/complete`,
        method: 'post'
      })
      ElMessage.success('操作成功')
      loadBookings()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.coach-bookings {
  padding: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>