<template>
  <div class="coach-list">
    <el-row :gutter="20">
      <el-col :span="6" v-for="coach in coaches" :key="coach.id">
        <el-card class="coach-card" shadow="hover">
          <div class="coach-info">
            <div class="coach-avatar">
              <el-icon><User /></el-icon>
            </div>
            <h3 class="coach-name">{{ coach.name }}</h3>
            <div class="coach-detail">
              <p><el-icon><Car /></el-icon> {{ coach.car_model }}</p>
              <p>
                <el-icon><Star /></el-icon>
                <span class="rating">{{ coach.avg_rating }}</span>
                <span class="rating-count">({{ coach.rating_count }}次评价)</span>
              </p>
              <p v-if="coach.accept_carpool === 1" class="carpool-badge">
                <el-tag type="primary" effect="dark" size="small">接受拼车</el-tag>
              </p>
            </div>
            <el-button type="primary" style="width: 100%" @click="viewSlots(coach)">
              查看时段
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="slotDialogVisible"
      :title="`${selectedCoach?.name} - 可选时段`"
      width="900px"
    >
      <div v-loading="slotLoading">
        <div class="date-tabs">
          <el-radio-group v-model="selectedDate" @change="loadSlots">
            <el-radio-button v-for="date in dateRange" :key="date" :label="date">
              {{ formatDate(date) }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="operation-tips" v-if="selectedCoach?.accept_carpool === 1">
          <el-tag type="success">可预约</el-tag>
          <span class="tip-text">点击独自预约</span>
          <el-tag type="primary">拼车中</el-tag>
          <span class="tip-text">已有1人，点击加入拼车</span>
          <el-tag type="warning">已预约</el-tag>
          <span class="tip-text">该时段已满</span>
        </div>
        <div class="operation-tips" v-else>
          <el-tag type="success">可预约</el-tag>
          <span class="tip-text">点击预约</span>
          <el-tag type="warning">已预约</el-tag>
          <span class="tip-text">该时段已满</span>
        </div>
        <div class="slots-grid" v-if="slots.length">
          <div
            v-for="slot in slots"
            :key="slot.slotDate + '-' + slot.startHour"
            class="slot-item"
            :class="{
              'slot-available': slot.status === 1,
              'slot-booked': slot.status === 2,
              'slot-carpool': slot.status === 4,
              'slot-locked': slot.status === 3,
              'slot-empty': slot.status === 0
            }"
            @click="handleSlotClick(slot)"
          >
            <div class="slot-time">{{ slot.startHour }}:00 - {{ slot.startHour + 1 }}:00</div>
            <div class="slot-status">{{ getStatusText(slot.status) }}</div>
            <div class="slot-actions" v-if="slot.status === 1 && selectedCoach?.accept_carpool === 1">
              <el-button type="success" size="small" @click.stop="initiateCarpool(slot)">
                发起拼团
              </el-button>
            </div>
            <div class="slot-actions" v-if="slot.status === 4">
              <el-button type="primary" size="small" @click.stop="joinCarpool(slot)">
                加入拼团
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无时段数据" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="carpoolDialogVisible"
      title="拼车信息"
      width="500px"
    >
      <div v-loading="carpoolLoading" v-if="waitingCarpool">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="发起人">
            {{ waitingCarpool.initiator_name }}
          </el-descriptions-item>
          <el-descriptions-item label="日期">
            {{ waitingCarpool.slot_date }}
          </el-descriptions-item>
          <el-descriptions-item label="时段">
            {{ waitingCarpool.start_hour }}:00 - {{ waitingCarpool.start_hour + 1 }}:00
          </el-descriptions-item>
          <el-descriptions-item label="当前人数">
            {{ waitingCarpool.member_count }}/2人
          </el-descriptions-item>
          <el-descriptions-item label="拼车说明">
            两人轮流各开30分钟，享受拼车折扣价
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="carpoolDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="joining" @click="confirmJoinCarpool">
          确认加入拼车
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const coaches = ref([])
const slotDialogVisible = ref(false)
const selectedCoach = ref(null)
const slots = ref([])
const slotLoading = ref(false)
const selectedDate = ref('')

const carpoolDialogVisible = ref(false)
const carpoolLoading = ref(false)
const joining = ref(false)
const waitingCarpool = ref(null)
const currentSlot = ref(null)

const dateRange = computed(() => {
  const dates = []
  for (let i = 1; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
})

const loadCoaches = async () => {
  try {
    const res = await request({
      url: '/coach/list',
      method: 'get'
    })
    coaches.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const viewSlots = (coach) => {
  selectedCoach.value = coach
  selectedDate.value = dateRange.value[0]
  slotDialogVisible.value = true
  loadSlots()
}

const loadSlots = async () => {
  if (!selectedCoach.value) return
  slotLoading.value = true
  try {
    const res = await request({
      url: `/coach/${selectedCoach.value.id}/slots`,
      method: 'get',
      params: { date: selectedDate.value }
    })
    slots.value = res.data.filter(s => s.slotDate === selectedDate.value)
  } catch (error) {
    console.error(error)
  } finally {
    slotLoading.value = false
  }
}

const getStatusText = (status) => {
  const statusMap = {
    0: '未设置',
    1: '可预约',
    2: '已预约',
    3: '已锁定',
    4: '拼车中'
  }
  return statusMap[status] || '未知'
}

const handleSlotClick = (slot) => {
  if (slot.status === 1) {
    if (selectedCoach.value?.accept_carpool === 1) {
      ElMessageBox.confirm(
        `确认独自预约 ${slot.slotDate} ${slot.startHour}:00-${slot.startHour + 1}:00 的课程吗？\n\n提示：该教练接受拼车，您也可以选择发起拼团享受折扣。`,
        '预约确认',
        {
          confirmButtonText: '确认独自预约',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        bookSlot(slot)
      }).catch(() => {})
    } else {
      ElMessageBox.confirm(
        `确认预约 ${slot.slotDate} ${slot.startHour}:00-${slot.startHour + 1}:00 的课程吗？`,
        '预约确认',
        {
          confirmButtonText: '确认预约',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        bookSlot(slot)
      }).catch(() => {})
    }
  }
}

const bookSlot = async (slot) => {
  try {
    await request({
      url: '/student/book',
      method: 'post',
      data: {
        coachId: selectedCoach.value.id,
        slotDate: slot.slotDate,
        startHour: slot.startHour
      }
    })
    ElMessage.success('预约成功')
    loadSlots()
  } catch (error) {
    console.error(error)
  }
}

const initiateCarpool = async (slot) => {
  ElMessageBox.confirm(
    `确认发起拼车 ${slot.slotDate} ${slot.startHour}:00-${slot.startHour + 1}:00 的课程吗？\n\n拼车说明：\n- 两人轮流各开30分钟\n- 享受拼车折扣价\n- 等待拼友加入，拼友加入后拼车成功`,
    '发起拼车',
    {
      confirmButtonText: '确认发起',
      cancelButtonText: '取消',
      type: 'primary'
    }
  ).then(async () => {
    try {
      await request({
        url: '/student/carpool/initiate',
        method: 'post',
        data: {
          coachId: selectedCoach.value.id,
          slotDate: slot.slotDate,
          startHour: slot.startHour
        }
      })
      ElMessage.success('已发起拼车，等待拼友加入')
      loadSlots()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const joinCarpool = async (slot) => {
  currentSlot.value = slot
  carpoolLoading.value = true
  try {
    const res = await request({
      url: '/student/carpool/waiting',
      method: 'get',
      params: {
        coachId: selectedCoach.value.id,
        slotDate: slot.slotDate,
        startHour: slot.startHour
      }
    })
    waitingCarpool.value = res.data
    carpoolDialogVisible.value = true
  } catch (error) {
    console.error(error)
  } finally {
    carpoolLoading.value = false
  }
}

const confirmJoinCarpool = async () => {
  if (!waitingCarpool.value) return
  joining.value = true
  try {
    await request({
      url: '/student/carpool/join',
      method: 'post',
      data: {
        carpoolGroupId: waitingCarpool.value.id
      }
    })
    ElMessage.success('加入拼车成功')
    carpoolDialogVisible.value = false
    loadSlots()
  } catch (error) {
    console.error(error)
  } finally {
    joining.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`
}

onMounted(() => {
  loadCoaches()
})
</script>

<style scoped>
.coach-list {
  padding: 20px;
}

.coach-card {
  margin-bottom: 20px;
}

.coach-info {
  text-align: center;
  padding: 10px;
}

.coach-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: #e6f2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #409eff;
}

.coach-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.coach-detail {
  margin-bottom: 15px;
}

.coach-detail p {
  margin: 8px 0;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.carpool-badge {
  margin-top: 10px;
}

.rating {
  color: #f7ba2a;
  font-weight: bold;
}

.rating-count {
  color: #909399;
  font-size: 12px;
}

.date-tabs {
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.operation-tips {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tip-text {
  font-size: 12px;
  color: #909399;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.slot-item {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.slot-empty {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
}

.slot-available {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.slot-available:hover {
  background: #e1f3d8;
  transform: translateY(-2px);
}

.slot-booked {
  background: #fef0f0;
  color: #f56c6c;
  cursor: not-allowed;
}

.slot-carpool {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.slot-carpool:hover {
  background: #d9ecff;
  transform: translateY(-2px);
}

.slot-locked {
  background: #f4f4f5;
  color: #909399;
  cursor: not-allowed;
}

.slot-time {
  font-weight: bold;
  margin-bottom: 5px;
}

.slot-status {
  font-size: 12px;
}

.slot-actions {
  margin-top: 10px;
}

.slot-actions .el-button {
  font-size: 12px;
  padding: 5px 10px;
}
</style>