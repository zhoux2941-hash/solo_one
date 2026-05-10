<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Bell /></el-icon> 消息中心</span>
          <el-button
            v-if="messages.length > 0"
            type="primary"
            size="small"
            @click="handleMarkAllRead"
          >
            全部标为已读
          </el-button>
        </div>
      </template>
      
      <el-empty v-if="messages.length === 0 && !loading" description="暂无消息" />
      
      <div v-else>
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ unread: message.isRead === 0 }"
          @click="handleMessageClick(message)"
        >
          <div class="message-header">
            <el-tag
              :type="message.type === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ message.type === 1 ? '中标通知' : '系统消息' }}
            </el-tag>
            <el-tag v-if="message.isRead === 0" type="danger" size="small">
              未读
            </el-tag>
            <span class="message-time">{{ formatTime(message.createTime) }}</span>
          </div>
          <h4 class="message-title">{{ message.title }}</h4>
          <p class="message-content">{{ message.content }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyMessages, markAsRead, markAllAsRead } from '@/api/message'
import { ElMessage } from 'element-plus'

const router = useRouter()

const messages = ref([])
const loading = ref(false)

async function fetchMessages() {
  loading.value = true
  try {
    const res = await getMyMessages()
    messages.value = res.data
  } finally {
    loading.value = false
  }
}

async function handleMessageClick(message) {
  if (message.isRead === 0) {
    try {
      await markAsRead(message.id)
      message.isRead = 1
    } catch (e) {
      console.error(e)
    }
  }

  if (message.relatedTaskId) {
    router.push(`/task/${message.relatedTaskId}`)
  }
}

async function handleMarkAllRead() {
  try {
    await markAllAsRead()
    messages.value.forEach(m => m.isRead = 1)
    ElMessage.success('已全部标为已读')
  } catch (e) {
    console.error(e)
  }
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.message-item {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.unread {
  background-color: #ecf5ff;
}

.message-item.unread:hover {
  background-color: #d9ecff;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.message-time {
  margin-left: auto;
  color: #c0c4cc;
  font-size: 13px;
}

.message-title {
  margin: 0 0 10px;
  font-size: 16px;
  color: #303133;
}

.message-content {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
