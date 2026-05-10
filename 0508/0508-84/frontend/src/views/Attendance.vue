<template>
  <div class="attendance-container">
    <el-card>
      <template #header>
        <h3>志愿者签到签退</h3>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="扫码签到" name="scan">
          <el-row :gutter="20">
            <el-col :span="14">
              <div class="scan-section">
                <div class="scan-mode-selector">
                  <el-radio-group v-model="scanMode">
                    <el-radio-button value="camera">
                      <el-icon><Camera /></el-icon>
                      摄像头扫描
                    </el-radio-button>
                    <el-radio-button value="manual">
                      <el-icon><Edit /></el-icon>
                      手动输入
                    </el-radio-button>
                  </el-radio-group>
                </div>
                
                <div class="scan-content">
                  <div v-if="scanMode === 'camera'" class="camera-container">
                    <video 
                      v-if="isScanning" 
                      ref="videoElement" 
                      class="scan-video"
                      :class="{ mirror }
                    ></video>
                    <div v-else class="camera-placeholder">
                      <el-icon class="camera-icon"><Camera /></el-icon>
                      <p>点击下方按钮开启摄像头</p>
                    </div>
                    <div class="camera-actions">
                      <el-button type="primary" @click="startCamera" :disabled="isScanning">
                        {{ isScanning ? '扫描中...' : '开启摄像头扫描' }}
                      </el-button>
                      <el-button @click="stopCamera" :disabled="!isScanning">停止扫描</el-button>
                    </div>
                  </div>
                  
                  <div v-else class="manual-input">
                    <el-form label-width="100px">
                      <el-form-item label="二维码内容">
                        <el-input 
                          v-model="manualQRContent" 
                          type="textarea" 
                          :rows="3"
                          placeholder="请输入或粘贴二维码内容（如：volunteer://activity?activityId=1&activityName=..."
                        ></el-input>
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="handleManualScan" :loading="manualScanning">解析并签到</el-button>
                      </el-form-item>
                    </el-form>
                  </div>
                  
                  <el-divider>或</el-divider>
                  
                  <div class="quick-select">
                    <h4>快速选择活动</h4>
                    <el-select v-model="checkForm.activityId" placeholder="请选择活动" style="width: 100%;">
                      <el-option
                        v-for="activity in activeActivities"
                        :key="activity.id"
                        :label="activity.name"
                        :value="activity.id"
                      >
                        <div class="activity-option">
                          <span>{{ activity.name }}</span>
                          <span class="activity-time">{{ formatTime(activity.startTime) }}</span>
                        </div>
                      </el-option>
                    </el-select>
                    <div style="margin-top: 10px;">
                      <el-button type="success" :disabled="!checkForm.activityId" @click="handleCheckIn" :loading="checkingIn">
                        <el-icon><Right /></el-icon>
                        签到
                      </el-button>
                      <el-button type="warning" :disabled="!checkForm.activityId" @click="handleCheckOut" :loading="checkingOut">
                        <el-icon><Back /></el-icon>
                        签退
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="10">
              <div class="current-status">
                <h4>当前服务状态</h4>
                <el-empty v-if="!currentAttendance" description="尚未签到"></el-empty>
                <div v-else class="status-info">
                  <div>
                    <el-tag type="success">服务中</el-tag>
                  </div>
                  <div class="status-detail">
                    <div class="status-item">
                      <span class="label">活动:</span>
                      <span>{{ getActivityName(currentAttendance.activityId) }}</span>
                    </div>
                    <div class="status-item">
                      <span class="label">签到时间:</span>
                      <span>{{ formatTime(currentAttendance.checkInTime) }}</span>
                    </div>
                    <div class="status-item">
                      <span class="label">已服务时长:</span>
                      <span style="color: #f56c6c;" class="elapsed-time">{{ getElapsedTime }}</span>
                    </div>
                  </div>
                  <el-button type="warning" @click="handleCheckOut" :loading="checkingOut" style="margin-top: 15px;">
                    签退
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
        
        <el-tab-pane label="我的记录" name="records">
          <el-table :data="myAttendance" border>
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column label="活动名称" width="200">
              <template #default="scope">
                {{ getActivityName(scope.row.activityId) }}
              </template>
            </el-table-column>
            <el-table-column label="签到时间" width="180">
              <template #default="scope">
                {{ scope.row.checkInTime ? formatTime(scope.row.checkInTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="签退时间" width="180">
              <template #default="scope">
                {{ scope.row.checkOutTime ? formatTime(scope.row.checkOutTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="服务时长" width="120">
              <template #default="scope">
                {{ scope.row.durationMinutes ? scope.row.durationMinutes + ' 分钟' : '未签退' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="myAttendance.length === 0" description="暂无签到记录"></el-empty>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import jsQR from 'jsqr'
import { getActiveActivities } from '../api/activity'
import { checkIn, checkOut, getAttendanceByUser } from '../api/attendance'
import { parseQRCodeContent } from '../api/qrcode'
import { Right, Back, Camera, Edit } from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeTab = ref('scan')
const scanMode = ref('camera')
const activeActivities = ref([])
const myAttendance = ref([])
const checkingIn = ref(false)
const checkingOut = ref(false)
const isScanning = ref(false)
const manualScanning = ref(false)
const manualQRContent = ref('')

const checkForm = ref({
  activityId: null
})

const videoElement = ref(null)
let stream = null
let detectionInterval = null

const currentAttendance = computed(() => {
  return myAttendance.value.find(a => !a.checkOutTime)
})

const getElapsedTime = computed(() => {
  if (!currentAttendance.value) return '-'
  const now = new Date()
  const checkIn = new Date(currentAttendance.value.checkInTime)
  const diff = now - checkIn
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分钟`
})

const getActivityName = (activityId) => {
  const activity = activeActivities.value.find(a => a.id === activityId)
  return activity ? activity.name : '未知活动'
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  if (!status) return 'warning'
  const map = { 'PENDING': 'warning', 'APPROVED': 'success', 'REJECTED': 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  if (!status) return '进行中'
  const map = { 'PENDING': '待审核', 'APPROVED': '已通过', 'REJECTED': '已拒绝' }
  return map[status] || status
}

const loadData = async () => {
  const [activitiesRes, attendanceRes] = await Promise.all([
    getActiveActivities(),
    getAttendanceByUser(userStore.user.id)
  ])
  activeActivities.value = activitiesRes.data
  myAttendance.value = attendanceRes.data
}

const handleCheckIn = async () => {
  if (!checkForm.value.activityId) {
    ElMessage.warning('请选择活动')
    return
  }
  checkingIn.value = true
  try {
    await checkIn(userStore.user.id, checkForm.value.activityId)
    ElMessage.success('签到成功')
    await loadData()
  } catch (error) {
    console.error(error)
  } finally {
    checkingIn.value = false
  }
}

const handleCheckOut = async () => {
  const activityId = currentAttendance.value ? currentAttendance.value.activityId : checkForm.value.activityId
  if (!activityId) {
    ElMessage.warning('请先选择活动或进行签到')
    return
  }
  checkingOut.value = true
  try {
    await checkOut(userStore.user.id, activityId)
    ElMessage.success('签退成功，请等待管理员审核')
    await loadData()
  } catch (error) {
    console.error(error)
  } finally {
    checkingOut.value = false
  }
}

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      await videoElement.value.play()
      isScanning.value = true
      startQRCodeDetection()
    }
  } catch (error) {
    ElMessage.error('无法访问摄像头：' + error.message)
    ElMessage.info('请使用"手动输入"模式')
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  if (detectionInterval) {
    clearInterval(detectionInterval)
    detectionInterval = null
  }
  isScanning.value = false
}

const startQRCodeDetection = () => {
  ElMessage.info('摄像头已启动，请将二维码对准摄像头')
  
  detectionInterval = setInterval(async () => {
    const video = videoElement.value
    if (!video || video.videoWidth === 0) return
    
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      const result = await detectQRCodeFromImage(imageData)
      if (result) {
        await scanSuccess(result)
      }
    } catch (e) {
    }
  }, 500)
}

const detectQRCodeFromImage = (imageData) => {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    return code ? code.data : null
  } catch (e) {
    return null
  }
}

const scanSuccess = async (content) => {
  stopCamera()
  await processQRContent(content)
}

const processQRContent = async (content) => {
  manualScanning.value = true
  try {
    const parseRes = await parseQRCodeContent(content)
    if (parseRes.data && parseRes.data.activityId) {
      const activityId = parseInt(parseRes.data.activityId)
      checkForm.value.activityId = activityId
      ElMessage.success(`识别成功：${parseRes.data.activityName || '活动ID=' + activityId}`)
      await handleCheckIn()
    } else {
      ElMessage.error('无效的活动二维码')
    }
  } catch (error) {
    console.error(error)
  } finally {
    manualScanning.value = false
  }
}

const handleManualScan = async () => {
  if (!manualQRContent.value.trim()) {
    ElMessage.warning('请输入二维码内容')
    return
  }
  await processQRContent(manualQRContent.value.trim())
  manualQRContent.value = ''
}

onMounted(async () => {
  await loadData()
})

onUnmounted(() => {
  stopCamera()
})

watch(activeTab, () => {
  if (activeTab.value === 'records') {
    stopCamera()
  }
})
</script>

<style scoped>
.attendance-container {
  max-width: 1200px;
  margin: 0 auto;
}

.check-section {
  padding: 20px 0;
}

.activity-option {
  display: flex;
  flex-direction: column;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.current-status {
  text-align: center;
}

.current-status h4 {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-detail {
  text-align: left;
}

.status-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.status-item .label {
  color: #909399;
  margin-right: 10px;
}

.scan-mode-selector {
  margin-bottom: 20px;
  text-align: center;
}

.scan-content {
  padding: 20px;
}

.camera-container {
  text-align: center;
}

.scan-video {
  width: 100%;
  max-width: 400px;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.scan-video.mirror {
  transform: scaleX(-1);
}

.camera-placeholder {
  width: 100%;
  max-width: 400px;
  height: 300px;
  margin: 0 auto;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.camera-icon {
  font-size: 64px;
  color: #c0c4cc;
}

.camera-placeholder p {
  margin-top: 15px 0 0;
  color: #909399;
}

.camera-actions {
  margin-top: 20px;
}

.manual-input {
  max-width: 500px;
  margin: 0 auto;
}

.quick-select {
  margin-top: 20px;
}

.quick-select h4 {
  margin-bottom: 15px;
  color: #606266;
}
</style>
