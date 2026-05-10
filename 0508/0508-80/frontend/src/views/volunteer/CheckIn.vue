<template>
  <div class="checkin-page">
    <el-card class="checkin-card">
      <template #header>
        <div class="card-header">
          <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
          <span>签到</span>
        </div>
      </template>

      <div v-if="schedule" class="schedule-info">
        <div class="info-item">
          <span class="label">岗位：</span>
          <span class="value">{{ schedule.position.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">日期：</span>
          <span class="value">{{ schedule.scheduleDate }}</span>
        </div>
        <div class="info-item">
          <span class="label">时间：</span>
          <span class="value">{{ schedule.startTime }} - {{ schedule.endTime }}</span>
        </div>
        <div class="info-item">
          <span class="label">地点：</span>
          <span class="value">{{ schedule.location }}</span>
        </div>
        <div class="info-item">
          <span class="label">状态：</span>
          <el-tag :type="ScheduleStatus[schedule.status]?.type">
            {{ getScheduleStatusLabel(schedule.status) }}
          </el-tag>
        </div>
      </div>

      <div v-if="checkInInfo" class="checkin-success">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <h3>签到成功</h3>
        <p>签到时间：{{ formatTime(checkInInfo.checkInTime) }}</p>
        <p>签到方式：{{ getCheckInMethodLabel(checkInInfo.method) }}</p>
      </div>

      <div v-else-if="schedule?.status === 'PENDING'" class="checkin-methods">
        <h3>请选择签到方式</h3>
        
        <div class="method-tabs">
          <el-radio-group v-model="checkInMethod">
            <el-radio value="code">
              <el-icon class="method-icon"><Key /></el-icon>
              签到码
            </el-radio>
            <el-radio value="gps">
              <el-icon class="method-icon"><Location /></el-icon>
              GPS定位
            </el-radio>
          </el-radio-group>
        </div>

        <div class="code-input" v-if="checkInMethod === 'code'">
          <el-input 
            v-model="checkInCode" 
            placeholder="请输入签到码" 
            size="large"
            maxlength="20"
          />
          <el-button 
            type="primary" 
            size="large"
            :loading="checkingIn"
            @click="doCodeCheckIn"
          >
            签到
          </el-button>
        </div>

        <div class="gps-input" v-else>
          <el-button 
            type="primary" 
            size="large"
            :loading="checkingIn"
            @click="doGPSCheckIn"
          >
            <el-icon><Location /></el-icon>
            获取位置并签到
          </el-button>
          <p class="gps-tip">点击按钮获取当前位置进行签到</p>
        </div>
      </div>

      <div v-else-if="schedule?.status === 'CANCELLED'" class="checkin-cancelled">
        <el-icon class="error-icon"><CircleClose /></el-icon>
        <h3>该排班已取消</h3>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import { getScheduleStatusLabel, getCheckInMethodLabel, ScheduleStatus } from '@/utils/constants'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const schedule = ref(null)
const checkInInfo = ref(null)
const checkInMethod = ref('code')
const checkInCode = ref('')
const checkingIn = ref(false)

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function fetchSchedule() {
  try {
    const scheduleId = route.params.scheduleId
    const [scheduleRes, checkInRes] = await Promise.all([
      api.get(`/volunteer/schedule/${scheduleId}`),
      api.get(`/volunteer/checkin/${scheduleId}`)
    ])

    if (scheduleRes.data.success) {
      schedule.value = scheduleRes.data.data
    }
    if (checkInRes.data.success && checkInRes.data.data) {
      checkInInfo.value = checkInRes.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

async function doCodeCheckIn() {
  if (!checkInCode.value.trim()) {
    ElMessage.warning('请输入签到码')
    return
  }
  
  checkingIn.value = true
  try {
    const response = await api.post('/volunteer/checkin', {
      scheduleId: route.params.scheduleId,
      checkInCode: checkInCode.value
    })
    if (response.data.success) {
      ElMessage.success('签到成功')
      checkInInfo.value = response.data.data
      schedule.value.status = 'CHECKED_IN'
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (e) {
    console.error(e)
  } finally {
    checkingIn.value = false
  }
}

async function doGPSCheckIn() {
  checkingIn.value = true
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const response = await api.post('/volunteer/checkin', {
            scheduleId: route.params.scheduleId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          if (response.data.success) {
            ElMessage.success('签到成功')
            checkInInfo.value = response.data.data
            schedule.value.status = 'CHECKED_IN'
          } else {
            ElMessage.error(response.data.message)
          }
          checkingIn.value = false
        },
        (error) => {
          ElMessage.error('获取位置失败：' + error.message)
          checkingIn.value = false
        }
      )
    } else {
      ElMessage.error('您的浏览器不支持地理定位')
      checkingIn.value = false
    }
  } catch (e) {
    console.error(e)
    checkingIn.value = false
  }
}

onMounted(() => {
  fetchSchedule()
})
</script>

<style scoped>
.checkin-page {
  display: flex;
  justify-content: center;
}

.checkin-card {
  width: 500px;
}

.card-header {
  display: flex;
  align-items: center;
}

.back-icon {
  margin-right: 16px;
  cursor: pointer;
  font-size: 20px;
}

.schedule-info {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
  width: 80px;
}

.value {
  color: #303133;
  font-weight: 500;
}

.checkin-success {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 16px;
}

.checkin-success h3 {
  color: #67c23a;
  margin-bottom: 16px;
}

.checkin-success p {
  color: #606266;
  margin: 8px 0;
}

.checkin-methods h3 {
  text-align: center;
  margin-bottom: 24px;
  color: #303133;
}

.method-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.method-tabs .el-radio {
  margin-right: 40px;
  font-size: 16px;
}

.method-icon {
  margin-right: 8px;
  font-size: 18px;
}

.code-input {
  display: flex;
  gap: 12px;
}

.code-input .el-input {
  flex: 1;
}

.gps-input {
  text-align: center;
}

.gps-tip {
  margin-top: 16px;
  color: #909399;
  font-size: 13px;
}

.checkin-cancelled {
  text-align: center;
  padding: 40px 0;
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.checkin-cancelled h3 {
  color: #f56c6c;
}
</style>
