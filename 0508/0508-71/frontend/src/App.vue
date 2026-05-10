<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo" @click="goHome">
          <el-icon><Microphone /></el-icon>
          <span class="logo-text">配音任务接单系统</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="header-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="tasks">
            <el-icon><List /></el-icon>
            <span>任务大厅</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isPublisher" index="publish">
            <el-icon><Plus /></el-icon>
            <span>发布任务</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isPublisher" index="my-tasks">
            <el-icon><Document /></el-icon>
            <span>我的任务</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isVoiceActor" index="my-auditions">
            <el-icon><Headset /></el-icon>
            <span>我的试音</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isVoiceActor" index="profile">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isLoggedIn" index="wallet">
            <el-icon><Wallet /></el-icon>
            <span>我的钱包</span>
          </el-menu-item>
        </el-menu>
        <div class="header-right">
          <el-button
            v-if="userStore.isLoggedIn"
            type="text"
            @click="goMessages"
            class="message-btn"
          >
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
              <el-icon><Bell /></el-icon>
            </el-badge>
          </el-button>
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" icon="UserFilled" />
                <span class="user-name">{{ userStore.userInfo?.nickname }}</span>
                <span class="user-balance">{{ userStore.userInfo?.balance }} 积分</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="wallet">
                    <el-icon><Wallet /></el-icon>
                    我的钱包
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="goLogin">登录</el-button>
            <el-button @click="goRegister">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUnreadCount } from '@/api/message'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const unreadCount = ref(0)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/tasks') || path === '/') return 'tasks'
  if (path.startsWith('/publish')) return 'publish'
  if (path.startsWith('/my-tasks')) return 'my-tasks'
  if (path.startsWith('/my-auditions')) return 'my-auditions'
  if (path.startsWith('/profile')) return 'profile'
  if (path.startsWith('/wallet')) return 'wallet'
  if (path.startsWith('/messages')) return 'messages'
  return 'tasks'
})

function fetchUnreadCount() {
  if (userStore.isLoggedIn) {
    getUnreadCount().then(res => {
      unreadCount.value = res.data.count
    })
  }
}

function goHome() {
  router.push('/tasks')
}

function goLogin() {
  router.push('/login')
}

function goRegister() {
  router.push('/register')
}

function goMessages() {
  router.push('/messages')
}

function handleMenuSelect(index) {
  const pathMap = {
    tasks: '/tasks',
    publish: '/publish',
    'my-tasks': '/my-tasks',
    'my-auditions': '/my-auditions',
    profile: '/profile',
    wallet: '/wallet'
  }
  router.push(pathMap[index])
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else {
    router.push('/' + command)
  }
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 64px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
}

.logo .el-icon {
  font-size: 28px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
}

.header-menu {
  background: transparent;
  border-bottom: none;
  flex: 1;
  margin: 0 40px;
}

.header-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.9);
  border-bottom: none;
  height: 64px;
  line-height: 64px;
}

.header-menu :deep(.el-menu-item:hover) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.header-menu :deep(.el-menu-item.is-active) {
  color: white;
  border-bottom: 2px solid white;
  background: rgba(255, 255, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.message-btn {
  color: white;
  font-size: 20px;
}

.message-badge :deep(.el-icon) {
  font-size: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-balance {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.app-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
