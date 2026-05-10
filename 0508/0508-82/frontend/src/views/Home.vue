<template>
  <el-container class="home-container">
    <el-header class="header">
      <div class="logo">
        <el-icon :size="24"><Trophy /></el-icon>
        <span>知识竞赛抢答系统</span>
      </div>
      <div class="user-info">
        <span>{{ authStore.user?.username }} ({{ roleText }})</span>
        <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.isHost" index="/host">
            <el-icon><Monitor /></el-icon>
            <span>主持面板</span>
          </el-menu-item>
          <el-menu-item index="/team">
            <el-icon><User /></el-icon>
            <span>参赛面板</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.isHost" index="/questions">
            <el-icon><Document /></el-icon>
            <span>题库管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.isHost" index="/competitions">
            <el-icon><Tickets /></el-icon>
            <span>竞赛管理</span>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const roleText = computed(() => {
  return authStore.user?.role === 'HOST' ? '主持人' : '参赛队员'
})

const activeMenu = computed(() => {
  return route.path
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sidebar {
  background-color: #545c64;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
