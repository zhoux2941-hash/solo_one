<template>
  <el-container class="main-layout">
    <el-header class="main-header" height="60px">
      <span class="header-title">实验室危化品领用管理系统</span>
      <div class="user-info">
        <span>欢迎，{{ currentUser?.realName }}</span>
        <span class="role-badge">{{ getRoleName(currentUser?.role) }}</span>
        <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="notification-badge">
          <el-button type="primary" size="small" @click="goToNotifications">
            <el-icon><Bell /></el-icon>
            消息
          </el-button>
        </el-badge>
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" style="background-color: #fff; border-right: 1px solid #e4e7ed;">
        <el-menu
          :default-active="activeMenu"
          router
          style="border-right: none;"
        >
          <el-menu-item index="/chemicals">
            <el-icon><Beaker /></el-icon>
            <span>化学品库存</span>
          </el-menu-item>
          <el-menu-item v-if="currentUser?.role === 'LAB_TECHNICIAN'" index="/applications">
            <el-icon><Document /></el-icon>
            <span>我的申请</span>
          </el-menu-item>
          <el-menu-item v-if="currentUser?.role === 'SAFETY_OFFICER'" index="/first-review">
            <el-icon><Check /></el-icon>
            <span>一审审批</span>
          </el-menu-item>
          <el-menu-item v-if="currentUser?.role === 'DIRECTOR'" index="/second-review">
            <el-icon><Stamp /></el-icon>
            <span>二审审批</span>
          </el-menu-item>
          <el-menu-item index="/notifications">
            <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
              <el-icon><Bell /></el-icon>
            </el-badge>
            <span>我的消息</span>
          </el-menu-item>
          <el-menu-item v-if="currentUser?.role === 'SAFETY_OFFICER' || currentUser?.role === 'DIRECTOR'" index="/violations">
            <el-icon><Warning /></el-icon>
            <span>违规记录</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Beaker, Document, Check, Stamp, Bell, Warning } from '@element-plus/icons-vue'
import { logout } from '../api/auth'
import { getUnreadCount } from '../api/notification'

const router = useRouter()
const route = useRoute()

const currentUser = ref(null)
const unreadCount = ref(0)

let timer = null

const activeMenu = computed(() => route.path)

const getRoleName = (role) => {
  const roleMap = {
    LAB_TECHNICIAN: '实验员',
    SAFETY_OFFICER: '安全员',
    DIRECTOR: '主管'
  }
  return roleMap[role] || role
}

const loadUnreadCount = async () => {
  try {
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

const goToNotifications = () => {
  router.push('/notifications')
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
  loadUnreadCount()
  timer = setInterval(loadUnreadCount, 30000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.notification-badge :deep(.el-badge__content) {
  top: 2px;
}
</style>
