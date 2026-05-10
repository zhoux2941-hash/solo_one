<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <el-icon class="logo-icon"><Search /></el-icon>
          <span class="logo-text">失物招领平台</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
          router
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/lost">寻找失物</el-menu-item>
          <el-menu-item index="/found">拾物招领</el-menu-item>
          <template v-if="userStore.isLoggedIn">
            <el-menu-item index="/publish-lost">发布失物</el-menu-item>
            <el-menu-item index="/publish-found">发布拾物</el-menu-item>
            <el-menu-item index="/my-items">我的发布</el-menu-item>
            <el-menu-item index="/matches">匹配建议</el-menu-item>
          </template>
        </el-menu>
        <div class="user-actions">
          <template v-if="userStore.isLoggedIn">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
              <el-button text type="primary" @click="router.push('/messages')">
                <el-icon><Bell /></el-icon>
                消息
              </el-button>
            </el-badge>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" style="background-color: #409EFF;">
                  {{ userStore.nickname?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.nickname }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="my-items">我的发布</el-dropdown-item>
                  <el-dropdown-item command="messages">消息中心</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="router.push('/login')">登录</el-button>
            <el-button @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
    <el-footer class="footer">
      <p>&copy; 2026 失物招领平台 - 让物品找到回家的路</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { messageApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const unreadCount = ref(0)

onMounted(async () => {
  await userStore.fetchCurrentUser()
  if (userStore.isLoggedIn) {
    await fetchUnreadCount()
  }
})

async function fetchUnreadCount() {
  try {
    const res = await messageApi.unreadCount()
    unreadCount.value = res.data || 0
  } catch (e) {
    console.error('获取未读消息数失败', e)
  }
}

function handleCommand(command) {
  switch (command) {
    case 'my-items':
      router.push('/my-items')
      break
    case 'messages':
      router.push('/messages')
      break
    case 'logout':
      userStore.logout().then(() => {
        router.push('/')
      })
      break
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
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
}

.logo-icon {
  font-size: 28px;
  color: #409EFF;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  margin-left: 40px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.username {
  color: #606266;
}

.main {
  padding: 0;
  background-color: #f5f7fa;
}

.footer {
  background-color: #fff;
  text-align: center;
  color: #909399;
  line-height: 60px;
  border-top: 1px solid #ebeef5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
