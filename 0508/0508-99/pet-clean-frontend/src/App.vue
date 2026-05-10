<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="24"><Dog /></el-icon>
          <span class="title">宠物清洁打卡</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="dropdown-trigger">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ currentUser?.nickname || '未登录' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="login" v-if="!currentUser">登录</el-dropdown-item>
                <el-dropdown-item command="logout" v-if="currentUser">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button text @click="showNotifications" icon="Bell" circle />
          </el-badge>
        </div>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>

  <el-dialog v-model="loginDialogVisible" title="登录/注册" width="400px">
    <el-form :model="loginForm" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="loginForm.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="楼栋">
        <el-select v-model="loginForm.buildingId" placeholder="请选择楼栋">
          <el-option
            v-for="building in buildings"
            :key="building.id"
            :label="building.name"
            :value="building.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleLogin">登录/注册</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="notificationDrawer" title="我的通知" size="400px">
    <el-empty v-if="notifications.length === 0" description="暂无通知" />
    <div v-else class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'is-read': notification.isRead }"
      >
        <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
        <div class="notification-message">{{ notification.message }}</div>
        <el-button
          v-if="!notification.isRead"
          type="primary"
          size="small"
          @click="markAsRead(notification.id)"
        >
          标为已读
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()

const currentUser = ref(null)
const buildings = ref([])
const loginDialogVisible = ref(false)
const notificationDrawer = ref(false)
const notifications = ref([])

const loginForm = ref({
  username: '',
  nickname: '',
  buildingId: null
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length
})

onMounted(async () => {
  await loadBuildings()
  await checkLogin()
  if (currentUser.value) {
    await loadNotifications()
  }
})

const loadBuildings = async () => {
  try {
    const res = await api.getBuildings()
    buildings.value = res.data
  } catch (e) {
    console.error('加载楼栋失败', e)
  }
}

const checkLogin = () => {
  const user = localStorage.getItem('currentUser')
  if (user) {
    currentUser.value = JSON.parse(user)
  }
}

const handleCommand = (command) => {
  if (command === 'login') {
    loginDialogVisible.value = true
  } else if (command === 'logout') {
    handleLogout()
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

const handleLogin = async () => {
  if (!loginForm.value.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  try {
    let res
    try {
      res = await api.getUserByUsername(loginForm.value.username)
      currentUser.value = res.data
    } catch (e) {
      res = await api.createUser(loginForm.value)
      currentUser.value = res.data
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    loginDialogVisible.value = false
    loginForm.value = { username: '', nickname: '', buildingId: null }
    ElMessage.success('登录成功')
    await loadNotifications()
  } catch (e) {
    ElMessage.error('登录失败')
  }
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  currentUser.value = null
  notifications.value = []
  ElMessage.success('已退出登录')
}

const showNotifications = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }
  notificationDrawer.value = true
  await loadNotifications()
}

const loadNotifications = async () => {
  if (!currentUser.value) return
  try {
    const res = await api.getUserNotifications(currentUser.value.id)
    notifications.value = res.data
  } catch (e) {
    console.error('加载通知失败', e)
  }
}

const markAsRead = async (id) => {
  try {
    await api.markNotificationAsRead(id)
    await loadNotifications()
    ElMessage.success('已标为已读')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;

    .title {
      font-size: 20px;
      font-weight: 600;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .dropdown-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      cursor: pointer;

      .username {
        font-weight: 500;
      }
    }

    .notification-badge {
      :deep(.el-badge__content) {
        background-color: #f56c6c;
      }
    }
  }
}

.app-main {
  padding: 20px;
  background: #f5f7fa;
}

.notification-list {
  .notification-item {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    &.is-read {
      opacity: 0.6;
    }

    .notification-time {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .notification-message {
      font-size: 14px;
      color: #303133;
      line-height: 1.5;
      margin-bottom: 12px;
    }
  }
}
</style>
