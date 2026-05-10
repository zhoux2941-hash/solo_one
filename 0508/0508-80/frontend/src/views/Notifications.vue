<template>
  <div class="notifications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知中心</span>
          <el-button 
            v-if="unreadCount > 0" 
            type="primary" 
            size="small"
            @click="markAllAsRead"
          >
            全部已读
          </el-button>
        </div>
      </template>

      <el-empty v-if="notifications.length === 0" description="暂无通知" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="item in notifications"
          :key="item.id"
          :timestamp="formatTime(item.createdAt)"
          :type="item.isRead ? '' : 'primary'"
          :hollow="item.isRead"
        >
          <el-card 
            class="notification-card"
            :class="{ 'unread': !item.isRead }"
            shadow="hover"
            @click="handleMarkAsRead(item)"
          >
            <div class="notification-header">
              <el-tag :type="getNotificationTagType(item.type)" size="small">
                {{ getNotificationTypeLabel(item.type) }}
              </el-tag>
              <el-tag v-if="!item.isRead" type="danger" size="small">未读</el-tag>
            </div>
            <h4 class="notification-title">{{ item.title }}</h4>
            <p class="notification-content">{{ item.content }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import dayjs from 'dayjs'

const notifications = ref([])
const unreadCount = ref(0)

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function getNotificationTypeLabel(type) {
  const types = {
    SCHEDULE_ASSIGNED: '排班分配',
    APPROVAL: '申请通过',
    REJECTION: '申请拒绝',
    CHECK_IN_REMINDER: '签到提醒',
    SYSTEM: '系统通知'
  }
  return types[type] || type
}

function getNotificationTagType(type) {
  const types = {
    SCHEDULE_ASSIGNED: 'primary',
    APPROVAL: 'success',
    REJECTION: 'danger',
    CHECK_IN_REMINDER: 'warning',
    SYSTEM: 'info'
  }
  return types[type] || 'info'
}

async function fetchNotifications() {
  try {
    const response = await api.get('/volunteer/notifications')
    if (response.data.success) {
      notifications.value = response.data.data
      unreadCount.value = notifications.value.filter(n => !n.isRead).length
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleMarkAsRead(item) {
  if (item.isRead) return
  try {
    await api.post(`/volunteer/notifications/${item.id}/read`)
    item.isRead = true
    unreadCount.value--
  } catch (e) {
    console.error(e)
  }
}

async function markAllAsRead() {
  try {
    await api.post('/volunteer/notifications/read-all')
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-card {
  cursor: pointer;
  transition: all 0.3s;
}

.notification-card.unread {
  border-left: 4px solid #409eff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.notification-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}
</style>
