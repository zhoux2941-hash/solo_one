<template>
  <el-container class="app-container">
    <el-header class="app-header" v-if="userStore.user">
      <div class="logo">
        <el-icon><User /></el-icon>
        <span>社区志愿者时数存储系统</span>
      </div>
      <el-menu mode="horizontal" :default-active="activeMenu" router class="header-menu">
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/attendance">签到签退</el-menu-item>
        <el-menu-item index="/mall">兑换商城</el-menu-item>
        <el-menu-item index="/my-orders">我的订单</el-menu-item>
        <el-menu-item index="/ranking">时数排行榜</el-menu-item>
        <el-menu-item index="/admin" v-if="userStore.user?.role === 'ADMIN'">管理后台</el-menu-item>
      </el-menu>
      <div class="user-info">
        <span class="coins">时间币: {{ userStore.user?.timeCoins || 0 }}</span>
        <el-dropdown @command="handleCommand">
          <span class="dropdown-trigger">
            {{ userStore.user?.realName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './store/user'
import { ElMessage } from 'element-plus'
import { User, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: white;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  gap: 8px;
}

.header-menu {
  background: transparent;
  border: none;
  flex: 1;
  margin-left: 40px;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.9) !important;
}

.header-menu .el-menu-item:hover,
.header-menu .el-menu-item.is-active {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.coins {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.dropdown-trigger {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.app-main {
  padding: 20px;
}
</style>
