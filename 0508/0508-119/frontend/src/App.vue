<template>
  <el-container class="app-container" :style="{ height: '100vh' }">
    <el-header v-if="isLoggedIn" class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon"><ChargingPile /></el-icon>
        <span class="app-title">充电桩预约系统</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.currentUser?.realName || '用户' }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside v-if="isLoggedIn" width="200px" class="app-aside">
        <el-menu
          :default-active="currentRoute"
          router
          class="side-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/piles">
            <el-icon><Location /></el-icon>
            <span>充电桩列表</span>
          </el-menu-item>
          <el-menu-item index="/reservations">
            <el-icon><Calendar /></el-icon>
            <span>我的预约</span>
          </el-menu-item>
          <el-menu-item index="/fault-reports">
            <el-icon><Warning /></el-icon>
            <span>故障上报</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/admin">
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.currentUser?.role === 'ADMIN')
const currentRoute = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessageBox.alert(`
      姓名: ${userStore.currentUser?.realName}
      学号: ${userStore.currentUser?.studentId || '-'}
      角色: ${userStore.currentUser?.role === 'ADMIN' ? '管理员' : '学生'}
    `, '个人信息', {
      confirmButtonText: '确定'
    })
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn && route.path !== '/login' && route.path !== '/register') {
    router.push('/login')
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.app-aside {
  background-color: #304156;
}

.side-menu {
  border-right: none;
  height: 100%;
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
