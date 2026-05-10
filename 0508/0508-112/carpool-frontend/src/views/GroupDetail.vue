<template>
  <div class="group-detail">
    <el-page-header @back="goBack" :content="group?.destinationCity || '拼车小组'" />

    <el-row :gutter="24" class="content-row">
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <div class="card-title">
              <el-icon><InfoFilled /></el-icon>
              行程信息
            </div>
          </template>

          <div v-if="group" class="trip-info">
            <div class="info-row">
              <span class="label">出发</span>
              <span class="value">{{ group.departureCity }}</span>
            </div>
            <div class="info-row">
              <span class="label">到达</span>
              <span class="value">{{ group.destinationCity }}</span>
            </div>
            <div class="info-row">
              <span class="label">时间</span>
              <span class="value">{{ formatTime(group.departureTime) }}</span>
            </div>
            <div class="info-row">
              <span class="label">状态</span>
              <el-tag :type="statusType(group.status)" size="small">
                {{ statusText(group.status) }}
              </el-tag>
            </div>
          </div>

          <el-divider />

          <div class="members-section">
            <h4>
              <el-icon><UserFilled /></el-icon>
              成员列表
            </h4>
            <div class="members-list">
              <div v-for="member in group?.members || []" :key="member.id" class="member-item">
                <el-avatar :size="32" class="member-avatar">
                  {{ member.realName?.charAt(0) }}
                </el-avatar>
                <div class="member-info">
                  <span class="member-name">
                    {{ member.realName }}
                    <el-tag v-if="member.id === group?.leaderId" type="warning" size="small">组长</el-tag>
                  </span>
                  <span class="member-credit">
                    <el-tag :type="creditTagType(member.creditScore)" size="small">
                      守信{{ member.creditScore }}
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="actions-section" v-if="group?.status === 'ACTIVE'">
            <el-button 
              v-if="isLeader" 
              type="success" 
              :loading="completing"
              @click="handleComplete"
              style="width: 100%; margin-bottom: 8px;"
            >
              <el-icon><Check /></el-icon>
              完成行程（全员+5分）
            </el-button>
            <el-button 
              type="danger" 
              :loading="canceling"
              @click="handleCancel"
              style="width: 100%;"
            >
              <el-icon><Close /></el-icon>
              取消行程（-10分）
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="chat-card">
          <template #header>
            <div class="card-title">
              <el-icon><ChatDotRound /></el-icon>
              小组聊天
            </div>
          </template>

          <div class="chat-container">
            <div class="messages-list" ref="messagesContainer">
              <div v-if="messages.length === 0" class="no-messages">
                <el-empty description="还没有消息，说点什么吧" />
              </div>
              
              <div 
                v-for="msg in messages" 
                :key="msg.id" 
                :class="['message-item', { 'is-mine': msg.senderId === userId }]"
              >
                <el-avatar 
                  v-if="msg.senderId !== userId" 
                  :size="32" 
                  class="message-avatar"
                >
                  {{ msg.senderName?.charAt(0) }}
                </el-avatar>
                
                <div class="message-content">
                  <span v-if="msg.senderId !== userId" class="sender-name">
                    {{ msg.senderName }}
                  </span>
                  <div class="message-bubble">
                    {{ msg.content }}
                  </div>
                  <span class="message-time">{{ formatMessageTime(msg.createdAt) }}</span>
                </div>

                <el-avatar 
                  v-if="msg.senderId === userId" 
                  :size="32" 
                  class="message-avatar"
                >
                  {{ myName?.charAt(0) }}
                </el-avatar>
              </div>
            </div>

            <div class="chat-input">
              <el-input
                v-model="newMessage"
                placeholder="输入消息..."
                @keyup.enter="sendMessage"
                :disabled="group?.status !== 'ACTIVE'"
              >
                <template #append>
                  <el-button 
                    :icon="Promotion" 
                    @click="sendMessage"
                    :disabled="!newMessage.trim() || group?.status !== 'ACTIVE'"
                    :loading="sending"
                  >
                    发送
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useGroupApi } from '@/api/group'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const groupApi = useGroupApi()
const userStore = useUserStore()

const groupId = computed(() => Number(route.params.id))
const userId = computed(() => userStore.userId)
const myName = computed(() => userStore.realName)

const group = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)

const sending = ref(false)
const completing = ref(false)
const canceling = ref(false)

const isLeader = computed(() => {
  return group.value?.leaderId === userId.value
})

onMounted(() => {
  loadGroupDetail()
  loadMessages()
})

watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

const loadGroupDetail = async () => {
  try {
    const res = await groupApi.getGroupDetail(groupId.value)
    if (res.success) {
      group.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadMessages = async () => {
  try {
    const res = await groupApi.getGroupMessages(groupId.value)
    if (res.success) {
      messages.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return

  sending.value = true
  try {
    const res = await groupApi.sendMessage(groupId.value, { content: newMessage.value.trim() })
    if (res.success) {
      messages.value.push(res.data)
      newMessage.value = ''
    }
  } catch (e) {
  } finally {
    sending.value = false
  }
}

const handleComplete = async () => {
  try {
    await ElMessageBox.confirm(
      '确认行程已完成？所有成员守信指数+5。',
      '确认完成',
      { type: 'success' }
    )
    completing.value = true
    const res = await groupApi.completeTrip(groupId.value)
    if (res.success) {
      ElMessage.success(res.data)
      userStore.updateCreditScore(userStore.creditScore + 5)
      loadGroupDetail()
    }
  } catch (e) {
  } finally {
    completing.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm(
      '确认取消？你的守信指数-10。',
      '确认取消',
      { type: 'warning' }
    )
    canceling.value = true
    const res = await groupApi.cancelTrip(groupId.value, userId.value)
    if (res.success) {
      ElMessage.warning(res.data)
      userStore.updateCreditScore(Math.max(0, userStore.creditScore - 10))
      loadGroupDetail()
    }
  } catch (e) {
  } finally {
    canceling.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const goBack = () => {
  router.push('/groups')
}

const statusType = (status) => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'COMPLETED') return 'primary'
  if (status === 'CANCELED') return 'danger'
  return 'info'
}

const statusText = (status) => {
  if (status === 'ACTIVE') return '进行中'
  if (status === 'COMPLETED') return '已完成'
  if (status === 'CANCELED') return '已取消'
  return status
}

const creditTagType = (score) => {
  if (score >= 120) return 'success'
  if (score >= 100) return 'primary'
  if (score >= 80) return 'warning'
  return 'danger'
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatMessageTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style scoped>
.group-detail {
  padding-top: 0;
}

.content-row {
  margin-top: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.info-card {
  border-radius: 12px;
}

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
}

.label {
  width: 60px;
  color: #909399;
}

.value {
  color: #303133;
  font-weight: 500;
}

.members-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
}

.member-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: bold;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  color: #303133;
  font-weight: 500;
}

.member-credit {
  font-size: 12px;
}

.actions-section {
  margin-top: 16px;
}

.chat-card {
  border-radius: 12px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.no-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.is-mine .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.message-bubble {
  padding: 10px 14px;
  background: #f0f2f5;
  border-radius: 12px;
  color: #303133;
  word-break: break-word;
}

.message-item.is-mine .message-bubble {
  background: #409eff;
  color: #fff;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
