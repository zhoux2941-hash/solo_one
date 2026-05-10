<template>
  <AppLayout>
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 class="page-title" style="margin: 0;">站内消息</h2>
        <div>
          <el-radio-group v-model="filterType" size="small" @change="loadMessages">
            <el-radio-button label="all">全部消息</el-radio-button>
            <el-radio-button label="unread">未读消息</el-radio-button>
          </el-radio-group>
          <el-button 
            type="primary" 
            size="small" 
            style="margin-left: 10px;"
            :disabled="unreadCount === 0"
            @click="markAllAsRead"
          >
            <i class="el-icon-check"></i> 全部已读
          </el-button>
        </div>
      </div>

      <div v-if="loading" style="text-align: center; padding: 40px;">
        <i class="el-icon-loading" style="font-size: 24px;"></i>
        <span style="margin-left: 10px;">加载中...</span>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">📬</div>
        <div>暂无消息</div>
      </div>

      <div v-else>
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="card"
          :class="{ 'message-unread': !message.isRead }"
          style="margin-bottom: 15px; cursor: pointer;"
          @click="viewMessage(message)"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span 
                  v-if="!message.isRead" 
                  class="el-badge__content is-fixed"
                  style="position: relative; margin-right: 10px; transform: none;"
                >
                </span>
                <el-tag 
                  :type="getMessageType(message.type)"
                  size="small"
                  style="margin-right: 10px;"
                >
                  {{ getMessageTypeName(message.type) }}
                </el-tag>
                <h4 style="margin: 0; font-weight: 600;">{{ message.title }}</h4>
              </div>
              <div style="color: #606266; font-size: 14px; line-height: 1.6;">
                {{ message.content }}
              </div>
              <div v-if="message.stageName" style="margin-top: 10px; font-size: 12px; color: #909399;">
                <i class="el-icon-location-outline"></i>
                工序: {{ message.stageName }}
                <span v-if="message.relatedStageProgress" style="margin-left: 15px;">
                  当前进度: {{ message.relatedStageProgress }}%
                </span>
                <span v-if="message.overdueDays" style="margin-left: 15px; color: #f56c6c;">
                  逾期: {{ message.overdueDays }}天
                </span>
              </div>
            </div>
            <div style="text-align: right; margin-left: 20px;">
              <div style="font-size: 12px; color: #909399;">
                {{ formatTime(message.createTime) }}
              </div>
              <el-button 
                v-if="!message.isRead"
                type="text" 
                size="small"
                style="margin-top: 8px;"
                @click.stop="markAsRead(message)"
              >
                标为已读
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { messageAPI } from '../api'

export default {
  name: 'Messages',
  components: { AppLayout },
  data() {
    return {
      loading: false,
      messages: [],
      filterType: 'all',
      unreadCount: 0
    }
  },
  async created() {
    await this.loadUnreadCount()
    await this.loadMessages()
  },
  methods: {
    async loadUnreadCount() {
      try {
        const res = await messageAPI.getUnreadCount()
        this.unreadCount = res.data
      } catch (error) {
        console.error('加载未读数量失败', error)
      }
    },
    async loadMessages() {
      this.loading = true
      try {
        const onlyUnread = this.filterType === 'unread'
        const res = await messageAPI.getMessages(onlyUnread)
        this.messages = res.data
      } catch (error) {
        console.error('加载消息失败', error)
      } finally {
        this.loading = false
      }
    },
    async markAsRead(message) {
      try {
        await messageAPI.markAsRead(message.id)
        message.isRead = true
        this.unreadCount--
        this.$message.success('已标记为已读')
      } catch (error) {
        console.error('标记已读失败', error)
      }
    },
    async markAllAsRead() {
      try {
        await messageAPI.markAllAsRead()
        this.messages.forEach(m => m.isRead = true)
        this.unreadCount = 0
        this.$message.success('已全部标记为已读')
      } catch (error) {
        console.error('全部标记已读失败', error)
      }
    },
    viewMessage(message) {
      if (!message.isRead) {
        this.markAsRead(message)
      }
    },
    getMessageType(type) {
      if (type === 'WARNING') return 'danger'
      if (type === 'URGE_REPLY') return 'warning'
      return 'info'
    },
    getMessageTypeName(type) {
      if (type === 'WARNING') return '预警'
      if (type === 'URGE_REPLY') return '催进度回复'
      return '通知'
    },
    formatTime(time) {
      if (!time) return '-'
      const date = new Date(time)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.message-unread {
  border-left: 3px solid #409eff;
  background-color: #f5f7fa;
}
</style>
