<template>
  <div class="booking-page">
    <el-card class="checkin-alert-card" v-if="showCheckInAlert">
      <el-alert
        :title="checkInAlert.title"
        :type="checkInAlert.type"
        :description="checkInAlert.description"
        show-icon
        :closable="true"
        @close="showCheckInAlert = false"
      >
        <template #default v-if="checkInAlert.showAction">
          <el-button type="primary" size="small" @click="handleCheckIn(checkInAlert.bookingId)">
            立即签到
          </el-button>
          <el-button size="small" @click="showCheckInAlert = false">稍后提醒</el-button>
        </template>
      </el-alert>
    </el-card>

    <el-card class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">选择区域：</span>
          <el-select v-model="selectedArea" placeholder="全部区域" style="width: 180px" @change="loadSeatStatus">
            <el-option label="全部区域" value="" />
            <el-option v-for="area in areas" :key="area" :label="area" :value="area" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">选择日期：</span>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            style="width: 180px"
            @change="loadSeatStatus"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">当前用户ID：</span>
          <el-input-number v-model="userId" :min="1" :max="999" :controls-position="right" style="width: 120px" @change="loadUserBookings" />
        </div>
      </div>
    </el-card>

    <el-card class="my-bookings-card" v-if="myBookings.length > 0">
      <template #header>
        <div class="card-header">
          <el-icon><Tickets /></el-icon>
          <span>我的预订 ({{ myBookings.length }})</span>
        </div>
      </template>
      <div class="my-bookings-list">
        <div v-for="booking in myBookings" :key="booking.bookingId" class="booking-item" :class="getBookingClass(booking)">
          <div class="booking-info">
            <div class="booking-seat">
              <el-icon><Chair /></el-icon>
              <span>工位 #{{ booking.seatId }}</span>
            </div>
            <div class="booking-details">
              <span class="date">{{ formatDate(booking.date) }}</span>
              <el-tag :type="getTimeSlotTagType(booking.timeSlot)" size="small">
                {{ getTimeSlotLabel(booking.timeSlot) }}
              </el-tag>
              <el-tag :type="getStatusTagType(booking.status)" size="small">
                {{ getStatusLabel(booking.status) }}
              </el-tag>
            </div>
          </div>
          <div class="booking-actions">
            <el-button 
              v-if="booking.status === 'CONFIRMED' && isToday(booking.date)"
              type="success" 
              size="small"
              :icon="Clock"
              @click="handleCheckIn(booking.bookingId)"
            >
              签到
            </el-button>
            <el-button 
              v-if="booking.status === 'CONFIRMED'"
              type="danger" 
              size="small"
              :icon="Close"
              @click="cancelBooking(booking.bookingId)"
            >
              取消
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="legend-card">
      <div class="legend-title">图例说明</div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="seat-box available-morning"></div>
          <span>上午可用</span>
        </div>
        <div class="legend-item">
          <div class="seat-box available-afternoon"></div>
          <span>下午可用</span>
        </div>
        <div class="legend-item">
          <div class="seat-box booked-morning"></div>
          <span>上午已订</span>
        </div>
        <div class="legend-item">
          <div class="seat-box booked-afternoon"></div>
          <span>下午已订</span>
        </div>
        <div class="legend-item">
          <div class="seat-box has-monitor"></div>
          <span>有显示器</span>
        </div>
      </div>
    </el-card>

    <el-card v-for="(seats, area) in groupedSeats" :key="area" class="floor-plan-card">
      <template #header>
        <div class="area-header">
          <el-icon><MapLocation /></el-icon>
          <span>{{ area }} - 工位平面图</span>
        </div>
      </template>
      <div class="floor-plan">
        <div
          v-for="seat in seats"
          :key="seat.seatId"
          class="seat"
          :class="getSeatClass(seat)"
          @click="showBookingDialog(seat)"
        >
          <div class="seat-id">{{ seat.seatId }}</div>
          <div class="seat-monitor" v-if="seat.hasMonitor">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="seat-status">
            <span class="status-dot" :class="seat.morningStatus === 'AVAILABLE' ? 'available' : 'booked'"></span>
            <span class="status-label">上</span>
            <span class="status-dot" :class="seat.afternoonStatus === 'AVAILABLE' ? 'available' : 'booked'"></span>
            <span class="status-label">下</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="bookingDialogVisible"
      :title="`预订工位 #${selectedSeat?.seatId}`"
      width="450px"
    >
      <div v-if="selectedSeat" class="booking-form">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="工位编号">{{ selectedSeat.seatId }}</el-descriptions-item>
          <el-descriptions-item label="所在区域">{{ selectedSeat.area }}</el-descriptions-item>
          <el-descriptions-item label="位置描述">{{ selectedSeat.description || '无' }}</el-descriptions-item>
          <el-descriptions-item label="配备显示器">{{ selectedSeat.hasMonitor ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="预订日期">{{ formatDate(selectedDate) }}</el-descriptions-item>
        </el-descriptions>

        <el-alert type="info" style="margin-top: 16px" show-icon>
          <template #title>签到提醒</template>
          <p>请在预订时段开始后30分钟内完成签到，否则工位将被自动释放。</p>
          <p>上午签到时间：09:00 - 09:30</p>
          <p>下午签到时间：14:00 - 14:30</p>
        </el-alert>

        <el-form label-width="100px" style="margin-top: 20px">
          <el-form-item label="选择时段">
            <el-radio-group v-model="selectedTimeSlot">
              <el-radio 
                value="MORNING" 
                :disabled="selectedSeat.morningStatus === 'BOOKED'"
              >
                上午 (09:00-12:00)
                <el-tag v-if="selectedSeat.morningStatus === 'BOOKED'" type="danger" size="small" style="margin-left: 8px">已订</el-tag>
              </el-radio>
              <el-radio 
                value="AFTERNOON" 
                :disabled="selectedSeat.afternoonStatus === 'BOOKED'"
              >
                下午 (14:00-18:00)
                <el-tag v-if="selectedSeat.afternoonStatus === 'BOOKED'" type="danger" size="small" style="margin-left: 8px">已订</el-tag>
              </el-radio>
              <el-radio 
                value="FULL_DAY" 
                :disabled="selectedSeat.morningStatus === 'BOOKED' || selectedSeat.afternoonStatus === 'BOOKED'"
              >
                全天 (09:00-18:00)
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="bookingDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedTimeSlot" @click="submitBooking">
          确认预订
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Close } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { seatApi, bookingApi, checkInApi } from '@/api'

const areas = ref([])
const seatStatusList = ref([])
const selectedArea = ref('')
const selectedDate = ref(dayjs().toDate())
const userId = ref(1)
const bookingDialogVisible = ref(false)
const selectedSeat = ref(null)
const selectedTimeSlot = ref('')
const myBookings = ref([])
const showCheckInAlert = ref(false)
const checkInAlert = ref({
  title: '',
  type: 'warning',
  description: '',
  showAction: false,
  bookingId: null
})

let refreshInterval = null

const disabledDate = (time) => {
  return time.getTime() < dayjs().startOf('day').valueOf()
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), 'day')
}

const getTimeSlotLabel = (timeSlot) => {
  const labels = {
    'MORNING': '上午',
    'AFTERNOON': '下午',
    'FULL_DAY': '全天'
  }
  return labels[timeSlot] || timeSlot
}

const getTimeSlotTagType = (timeSlot) => {
  const types = {
    'MORNING': 'success',
    'AFTERNOON': 'primary',
    'FULL_DAY': 'warning'
  }
  return types[timeSlot] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'CONFIRMED': '已确认',
    'CHECKED_IN': '已签到',
    'AUTO_RELEASED': '已自动释放',
    'CANCELLED': '已取消'
  }
  return labels[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    'CONFIRMED': 'warning',
    'CHECKED_IN': 'success',
    'AUTO_RELEASED': 'info',
    'CANCELLED': 'danger'
  }
  return types[status] || 'info'
}

const getBookingClass = (booking) => {
  if (booking.status === 'AUTO_RELEASED') return 'booking-released'
  if (booking.status === 'CANCELLED') return 'booking-cancelled'
  if (booking.status === 'CHECKED_IN') return 'booking-checked-in'
  return ''
}

const groupedSeats = computed(() => {
  const groups = {}
  seatStatusList.value.forEach(seat => {
    if (!groups[seat.area]) {
      groups[seat.area] = []
    }
    groups[seat.area].push(seat)
  })
  
  Object.keys(groups).forEach(area => {
    groups[area].sort((a, b) => {
      if (a.rowNum !== b.rowNum) return a.rowNum - b.rowNum
      return a.colNum - b.colNum
    })
  })
  
  return groups
})

const getSeatClass = (seat) => {
  const classes = []
  if (seat.morningStatus === 'BOOKED') classes.push('booked-morning')
  else classes.push('available-morning')
  if (seat.afternoonStatus === 'BOOKED') classes.push('booked-afternoon')
  else classes.push('available-afternoon')
  if (seat.hasMonitor) classes.push('has-monitor')
  if (seat.morningStatus === 'BOOKED' && seat.afternoonStatus === 'BOOKED') classes.push('fully-booked')
  return classes
}

const loadAreas = async () => {
  try {
    const response = await seatApi.getAreas()
    areas.value = response.data
  } catch (error) {
    console.error('加载区域失败', error)
  }
}

const loadSeatStatus = async () => {
  try {
    const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD')
    const response = await seatApi.getSeatStatus(selectedArea.value, dateStr)
    seatStatusList.value = response.data
  } catch (error) {
    console.error('加载工位状态失败', error)
    ElMessage.error('加载工位状态失败')
  }
}

const loadUserBookings = async () => {
  try {
    const response = await checkInApi.getUserConfirmedBookings(userId.value)
    myBookings.value = response.data
    checkForCheckInReminder()
  } catch (error) {
    console.error('加载用户预订失败', error)
  }
}

const checkForCheckInReminder = () => {
  const now = dayjs()
  const today = now.format('YYYY-MM-DD')
  
  for (const booking of myBookings.value) {
    if (booking.date !== today) continue
    if (booking.status !== 'CONFIRMED') continue
    
    let checkInStart, checkInEnd
    
    if (booking.timeSlot === 'MORNING' || booking.timeSlot === 'FULL_DAY') {
      checkInStart = dayjs().hour(9).minute(0).second(0)
      checkInEnd = dayjs().hour(9).minute(30).second(0)
      
      if (now.isAfter(checkInStart) && now.isBefore(checkInEnd)) {
        showCheckInAlert.value = true
        checkInAlert.value = {
          title: '签到提醒',
          type: 'warning',
          description: `您预订的工位 #${booking.seatId}（${getTimeSlotLabel(booking.timeSlot)}）已到签到时间，请在9:30前完成签到，逾期将自动释放！`,
          showAction: true,
          bookingId: booking.bookingId
        }
        return
      }
    }
    
    if (booking.timeSlot === 'AFTERNOON' || booking.timeSlot === 'FULL_DAY') {
      checkInStart = dayjs().hour(14).minute(0).second(0)
      checkInEnd = dayjs().hour(14).minute(30).second(0)
      
      if (now.isAfter(checkInStart) && now.isBefore(checkInEnd)) {
        showCheckInAlert.value = true
        checkInAlert.value = {
          title: '签到提醒',
          type: 'warning',
          description: `您预订的工位 #${booking.seatId}（${getTimeSlotLabel(booking.timeSlot)}）已到签到时间，请在14:30前完成签到，逾期将自动释放！`,
          showAction: true,
          bookingId: booking.bookingId
        }
        return
      }
    }
  }
  
  showCheckInAlert.value = false
}

const showBookingDialog = (seat) => {
  selectedSeat.value = seat
  selectedTimeSlot.value = ''
  
  if (seat.morningStatus === 'AVAILABLE' && seat.afternoonStatus === 'AVAILABLE') {
    selectedTimeSlot.value = 'FULL_DAY'
  } else if (seat.morningStatus === 'AVAILABLE') {
    selectedTimeSlot.value = 'MORNING'
  } else if (seat.afternoonStatus === 'AVAILABLE') {
    selectedTimeSlot.value = 'AFTERNOON'
  }
  
  if (seat.morningStatus === 'BOOKED' && seat.afternoonStatus === 'BOOKED') {
    ElMessage.warning('该工位当天已全部被预订')
    return
  }
  
  bookingDialogVisible.value = true
}

const submitBooking = async () => {
  try {
    await bookingApi.createBooking({
      seatId: selectedSeat.value.seatId,
      userId: userId.value,
      date: dayjs(selectedDate.value).format('YYYY-MM-DD'),
      timeSlot: selectedTimeSlot.value
    })
    
    ElMessage.success('预订成功！请记得按时签到。')
    bookingDialogVisible.value = false
    await loadSeatStatus()
    await loadUserBookings()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '预订失败')
  }
}

const handleCheckIn = async (bookingId) => {
  try {
    const response = await checkInApi.checkIn(bookingId)
    if (response.data.success) {
      ElMessage.success('签到成功！')
      showCheckInAlert.value = false
      await loadUserBookings()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '签到失败')
  }
}

const cancelBooking = async (bookingId) => {
  try {
    await ElMessageBox.confirm('确定要取消该预订吗？', '取消预订', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await bookingApi.cancelBooking(bookingId)
    ElMessage.success('取消成功')
    await loadUserBookings()
    await loadSeatStatus()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const startRefreshInterval = () => {
  refreshInterval = setInterval(async () => {
    await loadSeatStatus()
    await loadUserBookings()
  }, 30000)
}

onMounted(() => {
  loadAreas()
  loadSeatStatus()
  loadUserBookings()
  startRefreshInterval()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

watch(userId, () => {
  loadUserBookings()
})
</script>

<style scoped>
.booking-page {
  padding: 0;
}

.checkin-alert-card {
  margin-bottom: 16px;
  padding: 0;
}

.checkin-alert-card :deep(.el-card__body) {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 500;
  color: #606266;
}

.my-bookings-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.my-bookings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
  transition: all 0.3s ease;
}

.booking-item:hover {
  background: #f0f9eb;
}

.booking-item.booking-released {
  border-left-color: #909399;
  opacity: 0.6;
}

.booking-item.booking-cancelled {
  border-left-color: #f56c6c;
  opacity: 0.6;
}

.booking-item.booking-checked-in {
  border-left-color: #67c23a;
}

.booking-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-seat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.booking-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.booking-details .date {
  color: #606266;
  font-size: 14px;
}

.legend-card {
  margin-bottom: 16px;
}

.legend-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.seat-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.seat-box.available-morning {
  background: linear-gradient(135deg, #67c23a 50%, #e4e7ed 50%);
}

.seat-box.available-afternoon {
  background: linear-gradient(135deg, #e4e7ed 50%, #67c23a 50%);
}

.seat-box.booked-morning {
  background: linear-gradient(135deg, #f56c6c 50%, #e4e7ed 50%);
}

.seat-box.booked-afternoon {
  background: linear-gradient(135deg, #e4e7ed 50%, #f56c6c 50%);
}

.seat-box.has-monitor {
  background: linear-gradient(135deg, #409eff 50%, #409eff 50%);
}

.floor-plan-card {
  margin-bottom: 16px;
}

.area-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.floor-plan {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  min-height: 200px;
}

.seat {
  width: 100px;
  height: 80px;
  border-radius: 8px;
  border: 2px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.seat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.seat.available-morning {
  border-left: 4px solid #67c23a;
}

.seat.available-afternoon {
  border-right: 4px solid #67c23a;
}

.seat.booked-morning {
  border-left: 4px solid #f56c6c;
}

.seat.booked-afternoon {
  border-right: 4px solid #f56c6c;
}

.seat.fully-booked {
  border-color: #f56c6c;
  background: #fef0f0;
}

.seat-id {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.seat-monitor {
  position: absolute;
  top: 6px;
  right: 6px;
  color: #409eff;
  font-size: 14px;
}

.seat-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.available {
  background: #67c23a;
}

.status-dot.booked {
  background: #f56c6c;
}

.status-label {
  color: #909399;
}

.booking-form {
  padding: 10px 0;
}
</style>
