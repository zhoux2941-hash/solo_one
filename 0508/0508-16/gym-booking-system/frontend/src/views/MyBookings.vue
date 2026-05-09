<template>
  <div class="my-bookings">
    <el-card class="page-header-card">
      <div class="page-header">
        <h2>我的预约</h2>
        <p>查看和管理您的课程预约记录</p>
      </div>
    </el-card>
    
    <el-tabs v-model="activeTab" class="booking-tabs">
      <el-tab-pane label="全部预约" name="all">
        <el-table :data="filteredBookings" style="width: 100%" v-loading="loading">
          <el-table-column prop="courseName" label="课程名称" width="200" />
          <el-table-column prop="coachName" label="教练" width="120" />
          <el-table-column label="课程时间" width="250">
            <template #default="scope">
              <div>{{ formatDate(scope.row.courseStartTime) }}</div>
              <div class="time-range">
                {{ formatTime(scope.row.courseStartTime) }} - {{ formatTime(scope.row.courseEndTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bookTime" label="预约时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.bookTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" effect="light">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签到时间" width="180">
            <template #default="scope">
              {{ scope.row.checkinTime ? formatDateTime(scope.row.checkinTime) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status === 'BOOKED'"
                type="success" 
                size="small"
                @click="checkIn(scope.row)"
                :disabled="!canCheckIn(scope.row)"
              >
                {{ canCheckIn(scope.row) ? '签到' : '签到未开始' }}
              </el-button>
              <el-button 
                v-if="scope.row.status === 'BOOKED'"
                type="danger" 
                size="small"
                plain
                @click="cancelBooking(scope.row)"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="已预约" name="BOOKED">
        <el-table :data="filteredBookings" style="width: 100%" v-loading="loading">
          <el-table-column prop="courseName" label="课程名称" width="200" />
          <el-table-column prop="coachName" label="教练" width="120" />
          <el-table-column label="课程时间" width="250">
            <template #default="scope">
              <div>{{ formatDate(scope.row.courseStartTime) }}</div>
              <div class="time-range">
                {{ formatTime(scope.row.courseStartTime) }} - {{ formatTime(scope.row.courseEndTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bookTime" label="预约时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.bookTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button 
                type="success" 
                size="small"
                @click="checkIn(scope.row)"
                :disabled="!canCheckIn(scope.row)"
              >
                {{ canCheckIn(scope.row) ? '签到' : '签到未开始' }}
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                plain
                @click="cancelBooking(scope.row)"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="已签到" name="CHECKED_IN">
        <el-table :data="filteredBookings" style="width: 100%" v-loading="loading">
          <el-table-column prop="courseName" label="课程名称" width="200" />
          <el-table-column prop="coachName" label="教练" width="120" />
          <el-table-column label="课程时间" width="250">
            <template #default="scope">
              <div>{{ formatDate(scope.row.courseStartTime) }}</div>
              <div class="time-range">
                {{ formatTime(scope.row.courseStartTime) }} - {{ formatTime(scope.row.courseEndTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="签到时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.checkinTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="爽约记录" name="NO_SHOW">
        <el-table :data="filteredBookings" style="width: 100%" v-loading="loading">
          <el-table-column prop="courseName" label="课程名称" width="200" />
          <el-table-column prop="coachName" label="教练" width="120" />
          <el-table-column label="课程时间" width="250">
            <template #default="scope">
              <div>{{ formatDate(scope.row.courseStartTime) }}</div>
              <div class="time-range">
                {{ formatTime(scope.row.courseStartTime) }} - {{ formatTime(scope.row.courseEndTime) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="bookTime" label="预约时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.bookTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    
    <el-empty v-if="!loading && filteredBookings.length === 0" :description="getEmptyDescription()" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bookingApi, courseApi } from '../utils/api'

const activeTab = ref('all')
const loading = ref(false)
const bookings = ref([])
const currentUser = { id: 1, name: '会员张三' }

const filteredBookings = computed(() => {
  if (activeTab.value === 'all') {
    return bookings.value
  }
  return bookings.value.filter(b => b.status === activeTab.value)
})

const getStatusType = (status) => {
  const map = {
    'BOOKED': 'warning',
    'CHECKED_IN': 'success',
    'NO_SHOW': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'BOOKED': '已预约',
    'CHECKED_IN': '已签到',
    'NO_SHOW': '已爽约'
  }
  return map[status] || status
}

const getEmptyDescription = () => {
  const map = {
    'all': '暂无预约记录',
    'BOOKED': '暂无已预约课程',
    'CHECKED_IN': '暂无已签到课程',
    'NO_SHOW': '暂无爽约记录'
  }
  return map[activeTab.value] || '暂无数据'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const canCheckIn = (booking) => {
  if (!booking.courseStartTime) return false
  const now = new Date()
  const courseStart = new Date(booking.courseStartTime)
  const checkInStart = new Date(courseStart.getTime() - 30 * 60 * 1000)
  return now >= checkInStart && now <= courseStart
}

const loadBookings = async () => {
  loading.value = true
  try {
    const data = await bookingApi.getByUser(currentUser.id)
    bookings.value = data
    
    for (const booking of bookings.value) {
      try {
        const course = await courseApi.getById(booking.courseId)
        booking.courseName = course.name
        booking.coachName = course.coachName
        booking.courseStartTime = course.startTime
        booking.courseEndTime = course.endTime
      } catch {
        booking.courseName = '课程已删除'
        booking.coachName = '-'
      }
    }
    
    bookings.value.sort((a, b) => new Date(b.courseStartTime) - new Date(a.courseStartTime))
  } catch (error) {
    ElMessage.error('加载预约记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const checkIn = async (booking) => {
  try {
    await bookingApi.checkin(booking.bookingId)
    ElMessage.success('签到成功！')
    booking.status = 'CHECKED_IN'
    booking.checkinTime = new Date().toISOString()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '签到失败')
  }
}

const cancelBooking = async (booking) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await bookingApi.cancel(booking.bookingId)
    ElMessage.success('取消预约成功')
    await loadBookings()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '取消失败')
    }
  }
}

watch(activeTab, () => {
  filteredBookings.value
})

onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.my-bookings {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.booking-tabs {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.time-range {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
</style>
