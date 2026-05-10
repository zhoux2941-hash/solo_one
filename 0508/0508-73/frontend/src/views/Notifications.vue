<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">我的消息</h2>
      <el-button type="primary" @click="handleMarkAllRead" :disabled="unreadCount === 0">
        全部标记已读
      </el-button>
    </div>

    <el-table :data="notifications" style="width: 100%" border v-loading="loading">
      <el-table-column label="状态" width="80">
        <template #default="scope">
          <el-badge :value="scope.row.isRead ? 0 : 1" :hidden="scope.row.isRead">
            <el-icon :size="20" :color="scope.row.isRead ? '#909399' : '#F56C6C'">
              <Bell />
            </el-icon>
          </el-badge>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="scope">
          <el-tag :type="getNotificationTagType(scope.row.type)">
            {{ getNotificationTypeName(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" width="200" />
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button 
            v-if="!scope.row.isRead" 
            type="primary" 
            size="small" 
            link 
            @click="handleMarkAsRead(scope.row)"
          >
            标记已读
          </el-button>
          <el-button 
            type="primary" 
            size="small" 
            link 
            @click="handleViewDetail(scope.row)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && notifications.length === 0" description="暂无消息" />

    <el-dialog v-model="detailDialogVisible" title="消息详情" width="500px">
      <div v-if="selectedNotification">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="类型">
            <el-tag :type="getNotificationTagType(selectedNotification.type)">
              {{ getNotificationTypeName(selectedNotification.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题">{{ selectedNotification.title }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ selectedNotification.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ selectedNotification.content }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../api/notification'

const notifications = ref([])
const loading = ref(false)
const unreadCount = ref(0)
const detailDialogVisible = ref(false)
const selectedNotification = ref(null)

let timer = null

const typeMap = {
  OVERDUE_REMINDER: { label: '超期提醒', type: 'danger' },
  APPROVAL_PASSED: { label: '审批通过', type: 'success' },
  APPROVAL_REJECTED: { label: '审批驳回', type: 'danger' },
  RETURN_REMINDER: { label: '归还提醒', type: 'warning' }
}

const getNotificationTypeName = (type) => {
  return typeMap[type]?.label || type
}

const getNotificationTagType = (type) => {
  return typeMap[type]?.type || 'info'
}

const loadNotifications = async () => {
  loading.value = true
  try {
    notifications.value = await getMyNotifications()
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('Failed to load notifications:', error)
  } finally {
    loading.value = false
  }
}

const handleMarkAsRead = async (notification) => {
  try {
    await markAsRead(notification.id)
    ElMessage.success('已标记为已读')
    loadNotifications()
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    ElMessage.success('全部已标记为已读')
    loadNotifications()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

const handleViewDetail = (notification) => {
  selectedNotification.value = notification
  detailDialogVisible.value = true
  if (!notification.isRead) {
    handleMarkAsRead(notification)
  }
}

onMounted(() => {
  loadNotifications()
  timer = setInterval(loadNotifications, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
