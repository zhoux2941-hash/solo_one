<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon success"><User /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalVolunteers }}</div>
              <div class="stat-label">志愿者总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon primary"><Postcard /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalPositions }}</div>
              <div class="stat-label">岗位数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon warning"><Calendar /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalSchedules }}</div>
              <div class="stat-label">已分配排班</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon info"><Check /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ stats.checkedInCount }}</div>
              <div class="stat-label">今日签到</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近通知</span>
              <el-link type="primary" @click="router.push('/notifications')">查看全部</el-link>
            </div>
          </template>
          <el-empty v-if="notifications.length === 0" description="暂无通知" />
          <el-list v-else>
            <el-list-item v-for="item in notifications.slice(0, 5)" :key="item.id" class="notification-item">
              <el-list-item-content>
                <div class="notification-title">
                  <el-icon v-if="!item.isRead" style="color: #f56c6c; margin-right: 4px;"><CircleDot /></el-icon>
                  <span :class="{ 'unread': !item.isRead }">{{ item.title }}</span>
                </div>
                <div class="notification-time">{{ formatTime(item.createdAt) }}</div>
              </el-list-item-content>
            </el-list-item>
          </el-list>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button v-if="isVolunteer" type="primary" @click="router.push('/positions')">
              <el-icon><Postcard /></el-icon>
              申请岗位
            </el-button>
            <el-button v-if="isVolunteer" type="success" @click="router.push('/my-schedules')">
              <el-icon><Calendar /></el-icon>
              查看排班
            </el-button>
            <el-button v-if="isLeaderOrAdmin" type="warning" @click="router.push('/leader/applications')">
              <el-icon><List /></el-icon>
              审核申请
            </el-button>
            <el-button v-if="isLeaderOrAdmin" type="info" @click="router.push('/leader/schedules')">
              <el-icon><Edit /></el-icon>
              分配排班
            </el-button>
            <el-button v-if="isAdmin" type="danger" @click="router.push('/admin/checkin-stats')">
              <el-icon><DataAnalysis /></el-icon>
              签到统计
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const isVolunteer = computed(() => authStore.user?.role === 'VOLUNTEER')
const isLeaderOrAdmin = computed(() => 
  authStore.user?.role === 'LEADER' || authStore.user?.role === 'ADMIN'
)
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

const stats = ref({
  totalVolunteers: 0,
  totalPositions: 0,
  totalSchedules: 0,
  checkedInCount: 0
})

const notifications = ref([])

function formatTime(time) {
  return dayjs(time).format('MM-DD HH:mm')
}

async function fetchStats() {
  try {
    const [positionsRes, notificationsRes] = await Promise.all([
      api.get('/positions/list'),
      api.get('/volunteer/notifications')
    ])

    if (positionsRes.data.success) {
      stats.value.totalPositions = positionsRes.data.data.length
    }

    if (notificationsRes.data.success) {
      notifications.value = notificationsRes.data.data
    }

    if (isLeaderOrAdmin.value) {
      try {
        const statsRes = await api.get('/admin/checkin-stats')
        if (statsRes.data.success) {
          stats.value.checkedInCount = statsRes.data.data.reduce((sum, item) => sum + item.checkedInCount, 0)
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.stat-card {
  height: 120px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 48px;
  margin-right: 16px;
}

.stat-icon.success { color: #67c23a; }
.stat-icon.primary { color: #409eff; }
.stat-icon.warning { color: #e6a23c; }
.stat-icon.info { color: #909399; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #303133;
}

.notification-title.unread {
  font-weight: bold;
}

.notification-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 140px;
  height: 50px;
}
</style>
