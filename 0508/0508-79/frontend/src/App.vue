<template>
  <div class="app">
    <el-container v-if="isLoggedIn">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo" @click="router.push('/home')">
            <el-icon :size="28"><Gift /></el-icon>
            <span class="logo-text">盲盒互换平台</span>
          </div>
          <el-menu :default-active="activeMenu" mode="horizontal" :router="true" class="header-menu">
            <el-menu-item index="/home">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/my-boxes">
              <el-icon><Box /></el-icon>
              <span>我的盲盒</span>
            </el-menu-item>
            <el-menu-item index="/intents">
              <el-icon><Goods /></el-icon>
              <span>交换意向</span>
            </el-menu-item>
            <el-menu-item index="/hall">
              <el-icon><Share /></el-icon>
              <span>匹配大厅</span>
            </el-menu-item>
            <el-menu-item index="/exchange-requests">
              <el-icon><ChatDotRound /></el-icon>
              <span>交换请求</span>
            </el-menu-item>
          </el-menu>
          <div class="header-right">
            <el-tooltip content="消息中心">
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
                <el-button circle @click="router.push('/messages')">
                  <el-icon><Bell /></el-icon>
                </el-button>
              </el-badge>
            </el-tooltip>
            <el-dropdown @command="handleCommand">
              <span class="user-name">
                <el-avatar :size="32">
                  <el-icon><User /></el-icon>
                </el-avatar>
                {{ currentUser?.nickname || currentUser?.username }}
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { 
  HomeFilled, Box, Goods, Share, ChatDotRound, Bell, User, Gift 
} from '@element-plus/icons-vue'
import { getUnreadCount } from '@/api/message'

const router = useRouter()
const route = useRoute()

const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const currentUser = computed(() => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
})
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)

let timer = null

const fetchUnreadCount = async () => {
  if (isLoggedIn.value) {
    try {
      const res = await getUnreadCount()
      unreadCount.value = res.data
    } catch (e) {
    }
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (timer) clearInterval(timer)
      router.push('/login')
    }).catch(() => {})
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    fetchUnreadCount()
    timer = setInterval(fetchUnreadCount, 30000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 64px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  color: #fff;
  cursor: pointer;
  margin-right: 40px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  margin-left: 8px;
}

.header-menu {
  flex: 1;
  background: transparent;
  border-bottom: none;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.8);
}

.header-menu .el-menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.header-menu .el-menu-item.is-active {
  color: #fff;
  border-bottom: 2px solid #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.message-badge {
  display: flex;
  align-items: center;
}

.user-name {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.app-main {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}
</style>
