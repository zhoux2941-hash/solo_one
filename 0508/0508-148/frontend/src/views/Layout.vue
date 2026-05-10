<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h3>水电费分摊</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/bills">
          <el-icon><Document /></el-icon>
          <span>账单管理</span>
        </el-menu-item>
        <el-menu-item index="/my-bills">
          <el-icon><Tickets /></el-icon>
          <span>我的账单</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="user-info">
          <span class="dorm-number">
            <el-icon><House /></el-icon>
            {{ userStore.user?.dormNumber }}
          </span>
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.user?.nickname }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled,
  Document,
  Tickets,
  House,
  UserFilled,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
}

.logo h3 {
  color: #fff;
  margin: 0;
  font-size: 18px;
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.dorm-number {
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-name {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
