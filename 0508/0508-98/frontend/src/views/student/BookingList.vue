<template>
  <div class="booking-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的预约</span>
        </div>
      </template>
      <el-table :data="bookings" v-loading="loading" stripe>
        <el-table-column label="教练" prop="coach_name" />
        <el-table-column label="车型" prop="car_model" />
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
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 1"
              type="danger"
              size="small"
              @click="cancelBooking(scope.row)"
            >
              取消预约
            </el-button>
            <el-button
              v-if="scope.row.status === 2 && !scope.row.rating_id"
              type="primary"
              size="small"
              @click="openRatingDialog(scope.row)"
            >
              评价课程
            </el-button>
            <el-tag
              v-if="scope.row.rating_id"
              type="success"
              effect="plain"
            >
              已评价
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !bookings.length" description="暂无预约记录" />
    </el-card>

    <el-dialog v-model="ratingDialogVisible" title="评价课程" width="500px">
      <el-form :model="ratingForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="ratingForm.score" :max="5" show-score />
        </el-form-item>
        <el-form-item label="评语">
          <el-input
            v-model="ratingForm.comment"
            type="textarea"
            rows="4"
            placeholder="请输入您的评价"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ratingDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRating">
          提交评价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const bookings = ref([])
const loading = ref(false)
const ratingDialogVisible = ref(false)
const submitting = ref(false)
const ratingForm = reactive({
  bookingId: null,
  score: 5,
  comment: ''
})

const hasCarpool = computed(() => {
  return bookings.value.some(b => b.is_carpool === 1)
})

const loadBookings = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/student/bookings',
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

const cancelBooking = (row) => {
  const isCarpool = row.is_carpool === 1
  const message = isCarpool
    ? '确定要取消该拼车预约吗？取消后拼车组人数会减少。'
    : '确定要取消该预约吗？'

  ElMessageBox.confirm(message, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const url = isCarpool
        ? `/student/carpool/${row.id}/cancel`
        : `/student/bookings/${row.id}/cancel`

      await request({
        url,
        method: 'post'
      })
      ElMessage.success('取消成功')
      loadBookings()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const openRatingDialog = (row) => {
  ratingForm.bookingId = row.id
  ratingForm.score = 5
  ratingForm.comment = ''
  ratingDialogVisible.value = true
}

const submitRating = async () => {
  submitting.value = true
  try {
    await request({
      url: '/student/rating',
      method: 'post',
      data: ratingForm
    })
    ElMessage.success('评价成功')
    ratingDialogVisible.value = false
    loadBookings()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.booking-list {
  padding: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>