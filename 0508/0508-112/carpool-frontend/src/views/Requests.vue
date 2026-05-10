<template>
  <div class="requests-container">
    <el-tabs v-model="activeTab" class="requests-tabs">
      <el-tab-pane label="我收到的申请" name="received">
        <el-empty v-if="receivedRequests.length === 0" description="暂无收到的申请" />
        
        <div v-else class="request-list">
          <el-card v-for="req in receivedRequests" :key="req.id" class="request-card" shadow="hover">
            <div class="request-header">
              <div class="route">
                <span class="city">{{ req.departureCity }}</span>
                <el-icon class="arrow"><Right /></el-icon>
                <span class="city">{{ req.destinationCity }}</span>
              </div>
              <el-tag type="warning" size="small">待处理</el-tag>
            </div>

            <div class="request-info">
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span class="requester">{{ req.requesterName }}</span>
                <el-tag :type="creditTagType(req.requesterCreditScore)" size="small">
                  守信{{ req.requesterCreditScore }}
                </el-tag>
              </div>
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTime(req.departureTime) }}</span>
              </div>
              <div class="info-item">
                <el-icon><UserFilled /></el-icon>
                <span>申请{{ req.seatsRequested }}个座位</span>
              </div>
            </div>

            <div v-if="req.message" class="request-message">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ req.message }}</span>
            </div>

            <div class="request-actions">
              <el-button type="success" :loading="acceptingId === req.id" @click="handleAccept(req)">
                <el-icon><Check /></el-icon>
                同意
              </el-button>
              <el-button type="danger" :loading="rejectingId === req.id" @click="handleReject(req)">
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我发起的申请" name="my">
        <el-empty v-if="myRequests.length === 0" description="暂无发起的申请" />
        
        <div v-else class="request-list">
          <el-card v-for="req in myRequests" :key="req.id" class="request-card" shadow="hover">
            <div class="request-header">
              <div class="route">
                <span class="city">{{ req.departureCity }}</span>
                <el-icon class="arrow"><Right /></el-icon>
                <span class="city">{{ req.destinationCity }}</span>
              </div>
              <el-tag :type="myStatusType(req.status)" size="small">
                {{ myStatusText(req.status) }}
              </el-tag>
            </div>

            <div class="request-info">
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTime(req.departureTime) }}</span>
              </div>
              <div class="info-item">
                <el-icon><UserFilled /></el-icon>
                <span>申请{{ req.seatsRequested }}个座位</span>
              </div>
              <div class="info-item">
                <el-icon><Timer /></el-icon>
                <span>申请时间：{{ formatTime(req.createdAt) }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useRequestApi } from '@/api/request'

const requestApi = useRequestApi()

const activeTab = ref('received')
const receivedRequests = ref([])
const myRequests = ref([])
const acceptingId = ref(null)
const rejectingId = ref(null)

onMounted(() => {
  loadRequests()
})

const loadRequests = async () => {
  try {
    const [receivedRes, myRes] = await Promise.all([
      requestApi.getReceivedRequests(),
      requestApi.getMyRequests()
    ])
    if (receivedRes.success) receivedRequests.value = receivedRes.data
    if (myRes.success) myRequests.value = myRes.data
  } catch (e) {
    console.error(e)
  }
}

const handleAccept = async (req) => {
  try {
    await ElMessageBox.confirm(
      `同意${req.requesterName}的拼车申请？\n将创建拼车小组并邀请其加入。`,
      '确认同意',
      { type: 'info' }
    )
    acceptingId.value = req.id
    const res = await requestApi.respondToRequest(req.id, 'ACCEPT')
    if (res.success) {
      ElMessage.success('已同意，拼车小组已创建')
      receivedRequests.value = receivedRequests.value.filter(r => r.id !== req.id)
    }
  } catch (e) {
  } finally {
    acceptingId.value = null
  }
}

const handleReject = async (req) => {
  try {
    await ElMessageBox.confirm(
      `拒绝${req.requesterName}的拼车申请？`,
      '确认拒绝',
      { type: 'warning' }
    )
    rejectingId.value = req.id
    const res = await requestApi.respondToRequest(req.id, 'REJECT')
    if (res.success) {
      ElMessage.success('已拒绝')
      receivedRequests.value = receivedRequests.value.filter(r => r.id !== req.id)
    }
  } catch (e) {
  } finally {
    rejectingId.value = null
  }
}

const creditTagType = (score) => {
  if (score >= 120) return 'success'
  if (score >= 100) return 'primary'
  if (score >= 80) return 'warning'
  return 'danger'
}

const myStatusType = (status) => {
  if (status === 'PENDING') return 'warning'
  if (status === 'ACCEPTED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'info'
}

const myStatusText = (status) => {
  if (status === 'PENDING') return '待处理'
  if (status === 'ACCEPTED') return '已同意'
  if (status === 'REJECTED') return '已拒绝'
  return status
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.requests-container {
  padding-top: 0;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.request-card {
  border-radius: 12px;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.route {
  display: flex;
  align-items: center;
  gap: 12px;
}

.city {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.arrow {
  color: #909399;
}

.request-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.requester {
  font-weight: 500;
  color: #303133;
}

.request-message {
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
