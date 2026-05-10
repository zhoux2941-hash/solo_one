<template>
  <div class="messages-page">
    <div class="flex space-between items-center mb-20">
      <h2 class="page-title">消息中心</h2>
      <el-button type="primary" size="small" @click="handleMarkAllRead" :disabled="unreadCount === 0">
        全部标记已读
      </el-button>
    </div>

    <el-empty v-if="!messages.length" description="暂无消息" />
    <div v-else class="message-list">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message-item"
        :class="{ 'is-read': msg.isRead }"
        @click="handleRead(msg)"
      >
        <div class="message-icon">
          <el-tag :type="getTypeTag(msg.type)" effect="dark">
            {{ getTypeText(msg.type) }}
          </el-tag>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="title">{{ msg.title }}</span>
            <span class="time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <p class="preview">{{ msg.content }}</p>
        </div>
        <div v-if="!msg.isRead" class="unread-dot"></div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchMessages"
      />
    </div>

    <el-dialog v-model="showDetailDialog" :title="selectedMessage?.title" width="500px">
      <div v-if="selectedMessage" class="message-detail">
        <div class="detail-header">
          <el-tag :type="getTypeTag(selectedMessage.type)" effect="dark">
            {{ getTypeText(selectedMessage.type) }}
          </el-tag>
          <span class="time">{{ formatTime(selectedMessage.createdAt) }}</span>
        </div>
        <div class="detail-content">
          {{ selectedMessage.content }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMessagesPaginated, getUnreadCount, markAsRead, markAllAsRead } from '@/api/message'

const messages = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)
const unreadCount = ref(0)
const showDetailDialog = ref(false)
const selectedMessage = ref(null)

const getTypeTag = (type) => {
  const map = { MATCH: 'success', REQUEST: 'warning', SYSTEM: 'info' }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = { MATCH: '匹配通知', REQUEST: '交换请求', SYSTEM: '系统消息' }
  return map[type] || '消息'
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const fetchMessages = async () => {
  try {
    const res = await getMessagesPaginated({
      page: currentPage.value - 1,
      size: pageSize.value
    })
    messages.value = res.data.content
    total.value = res.data.totalElements
    totalPages.value = res.data.totalPages
    const unreadRes = await getUnreadCount()
    unreadCount.value = unreadRes.data
  } catch (e) {
  }
}

const handleRead = async (msg) => {
  selectedMessage.value = msg
  showDetailDialog.value = true
  if (!msg.isRead) {
    try {
      await markAsRead(msg.id)
      msg.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    ElMessage.success('已全部标记为已读')
    fetchMessages()
  } catch (e) {
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.messages-page {
  max-width: 800px;
  margin: 0 auto;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.message-item:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.message-item.is-read {
  opacity: 0.7;
}

.message-icon {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-header .title {
  font-weight: bold;
  color: #333;
}

.message-header .time {
  font-size: 12px;
  color: #999;
}

.message-content .preview {
  margin: 0;
  font-size: 14px;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.message-detail .detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.message-detail .detail-header .time {
  font-size: 12px;
  color: #999;
}

.message-detail .detail-content {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.6;
  color: #333;
}
</style>
