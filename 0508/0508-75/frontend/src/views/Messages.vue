<template>
  <div class="page-container">
    <h2 class="page-title">
      <el-icon><Bell /></el-icon>
      消息中心
    </h2>

    <div v-if="loading" class="loading-container">
      <el-loading />
    </div>

    <div v-else-if="messages.length > 0" class="message-list">
      <el-card
        v-for="msg in messages"
        :key="msg.id"
        class="message-card"
        :class="{ unread: msg.isRead === 0 }"
        shadow="hover"
        @click="readMessage(msg)"
      >
        <div class="message-header">
          <div class="message-title">
            <el-icon v-if="msg.isRead === 0" class="unread-dot"><Dot /></el-icon>
            <span>{{ msg.title }}</span>
          </div>
          <span class="message-time">{{ formatDateTime(msg.createTime) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
      </el-card>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无消息">
        <template #image>
          <el-icon size="80" color="#c0c4cc"><Bell /></el-icon>
        </template>
        <p>系统匹配成功后会给您发送站内消息</p>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { messageApi } from '@/api'

const loading = ref(false)
const messages = ref([])

onMounted(() => loadMessages())

async function loadMessages() {
  loading.value = true
  try {
    const res = await messageApi.list()
    messages.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function readMessage(msg) {
  if (msg.isRead === 0) {
    try {
      await messageApi.markRead(msg.id)
      msg.isRead = 1
    } catch (e) {
      console.error(e)
    }
  }
}

function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-card {
  cursor: pointer;
  transition: all 0.2s;
}

.message-card.unread {
  border-left: 4px solid #409EFF;
}

.message-card:hover {
  transform: translateX(4px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-card.unread .message-title {
  color: #409EFF;
}

.unread-dot {
  color: #F56C6C;
  font-size: 18px;
}

.message-time {
  font-size: 13px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
