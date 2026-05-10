<template>
  <div class="schedule">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>我的排班</span>
            <el-switch
              v-model="acceptCarpool"
              active-text="接受拼车"
              inactive-text="不接受拼车"
              @change="handleCarpoolChange"
            />
          </div>
          <el-radio-group v-model="selectedDate" @change="loadSlots">
            <el-radio-button v-for="date in dateRange" :key="date" :label="date">
              {{ formatDate(date) }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="operation-tips">
        <el-tag type="success">可预约</el-tag>
        <span class="tip-text">点击设置为可预约</span>
        <el-tag type="warning">已预约</el-tag>
        <span class="tip-text">学员已预约</span>
        <el-tag type="primary">拼车中</el-tag>
        <span class="tip-text">已有1人，等待拼友</span>
        <el-tag type="info">已锁定</el-tag>
        <span class="tip-text">点击锁定/解锁时段</span>
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
        </div>
      </div>
      <el-empty v-if="!loading && !slots.length" description="暂无排班数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const slots = ref([])
const loading = ref(false)
const selectedDate = ref('')
const acceptCarpool = ref(true)

const coachId = computed(() => userStore.userInfo?.coachId)

const dateRange = computed(() => {
  const dates = []
  for (let i = 1; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
})

const loadCarpoolStatus = async () => {
  try {
    const res = await request({
      url: '/coach/manage/carpool/status',
      method: 'get'
    })
    acceptCarpool.value = res.data.acceptCarpool
  } catch (error) {
    console.error(error)
  }
}

const handleCarpoolChange = async (val) => {
  try {
    await ElMessageBox.confirm(
      val ? '确定要开启拼车模式吗？开启后学员可以发起拼车预约' : '确定要关闭拼车模式吗？关闭后学员无法发起拼车预约',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await request({
      url: '/coach/manage/carpool/accept',
      method: 'post',
      params: { accept: val }
    })
    ElMessage.success(val ? '已开启拼车模式' : '已关闭拼车模式')
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
    acceptCarpool.value = !val
  }
}

const loadSlots = async () => {
  if (!coachId.value) return
  loading.value = true
  try {
    const res = await request({
      url: `/coach/${coachId.value}/slots`,
      method: 'get',
      params: { date: selectedDate.value }
    })
    slots.value = res.data.filter(s => s.slotDate === selectedDate.value)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
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

const handleSlotClick = async (slot) => {
  if (slot.status === 2 || slot.status === 4) {
    ElMessage.warning('该时段已被学员预约，无法操作')
    return
  }

  try {
    let url = ''
    if (slot.status === 0 || slot.status === 3) {
      url = '/coach/manage/set-available'
    } else if (slot.status === 1) {
      url = '/coach/manage/lock'
    }

    await request({
      url,
      method: 'post',
      data: {
        slotDate: slot.slotDate,
        startHour: slot.startHour
      }
    })
    ElMessage.success('操作成功')
    loadSlots()
  } catch (error) {
    console.error(error)
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`
}

onMounted(() => {
  selectedDate.value = dateRange.value[0]
  loadCarpoolStatus()
  loadSlots()
})
</script>

<style scoped>
.schedule {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
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
}

.slot-empty {
  background: #f5f7fa;
  color: #909399;
  border: 1px dashed #dcdfe6;
}

.slot-empty:hover {
  background: #e6f2ff;
  border-color: #409eff;
  color: #409eff;
}

.slot-available {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.slot-available:hover {
  background: #e1f3d8;
}

.slot-booked {
  background: #fdf6ec;
  color: #e6a23c;
  cursor: not-allowed;
}

.slot-carpool {
  background: #ecf5ff;
  color: #409eff;
  cursor: not-allowed;
}

.slot-locked {
  background: #f4f4f5;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.slot-locked:hover {
  background: #e9e9eb;
}

.slot-time {
  font-weight: bold;
  margin-bottom: 5px;
}

.slot-status {
  font-size: 12px;
}
</style>