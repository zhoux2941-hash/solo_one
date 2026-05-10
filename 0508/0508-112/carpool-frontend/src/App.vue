<template>
  <el-container class="app-container">
    <el-header v-if="isLoggedIn" class="app-header">
      <div class="header-content">
        <div class="logo" @click="goHome">
          <el-icon><Van /></el-icon>
          <span>拼车回家</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="home">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="publish">
            <el-icon><Plus /></el-icon>
            <span>发布行程</span>
          </el-menu-item>
          <el-menu-item index="my-trips">
            <el-icon><Tickets /></el-icon>
            <span>我的行程</span>
          </el-menu-item>
          <el-menu-item index="requests">
            <el-icon><Bell /></el-icon>
            <span>申请通知</span>
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="badge" />
          </el-menu-item>
          <el-menu-item index="groups">
            <el-icon><ChatDotRound /></el-icon>
            <span>我的拼车</span>
          </el-menu-item>
        </el-menu>
        <div class="user-info">
          <el-dropdown @command="handleUserCommand">
            <span class="user-name">
              <el-icon><User /></el-icon>
              {{ userStore.realName }}
              <el-tag :type="creditTagType" size="small" class="credit-tag">
                守信 {{ userStore.creditScore }}
              </el-tag>
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
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pendingCount = ref(0)

const isLoggedIn = computed(() => userStore.isLoggedIn)

const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  if (path === '/publish') return 'publish'
  if (path === '/my-trips') return 'my-trips'
  if (path === '/requests') return 'requests'
  if (path === '/groups' || path.startsWith('/groups/')) return 'groups'
  return 'home'
})

const creditTagType = computed(() => {
  const score = userStore.creditScore
  if (score >= 120) return 'success'
  if (score >= 100) return 'primary'
  if (score >= 80) return 'warning'
  return 'danger'
})

onMounted(() => {
  if (isLoggedIn.value) {
    loadPendingCount()
  }
})

const loadPendingCount = async () => {
  try {
    const { useRequestApi } = await import('@/api/request')
    const res = await useRequestApi().getReceivedRequests()
    if (res.success) {
      pendingCount.value = res.data.length
    }
  } catch (e) {
    console.error(e)
  }
}

const goHome = () => {
  router.push('/')
}

const handleMenuSelect = (index) => {
  const routes = {
    'home': '/',
    'publish': '/publish',
    'my-trips': '/my-trips',
    'requests': '/requests',
    'groups': '/groups'
  }
  router.push(routes[index])
}

const handleUserCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  margin-right: 40px;
  gap: 8px;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.user-info {
  margin-left: 20px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.credit-tag {
  margin-left: 8px;
}

.badge {
  margin-left: 4px;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}
</style>
