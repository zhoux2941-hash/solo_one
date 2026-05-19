<template>
  <div class="layout-container">
    <el-container style="height: 100vh">
      <el-aside width="220px" class="sidebar">
        <div class="logo">
          <el-icon><Tools /></el-icon>
          <span>运维工单系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/workorders">
            <el-icon><Document /></el-icon>
            <span>工单管理</span>
          </el-menu-item>
          <el-menu-item index="/workorder-create">
            <el-icon><Plus /></el-icon>
            <span>创建工单</span>
          </el-menu-item>
          <el-menu-item index="/devices">
            <el-icon><Monitor /></el-icon>
            <span>设备台账</span>
          </el-menu-item>
          <el-menu-item index="/approvals">
            <el-icon><Check /></el-icon>
            <span>审批流转</span>
          </el-menu-item>
          <el-menu-item index="/schedules">
            <el-icon><Calendar /></el-icon>
            <span>排班管理</span>
          </el-menu-item>
          <el-menu-item index="/alerts">
            <el-icon><BellFilled /></el-icon>
            <span>告警消息</span>
            <el-badge :value="alertStore.unreadCount" :hidden="alertStore.unreadCount === 0" class="badge" />
          </el-menu-item>
          <el-menu-item index="/maintenance">
            <el-icon><Tools /></el-icon>
            <span>维修记录</span>
          </el-menu-item>
          <el-menu-item index="/statistics">
            <el-icon><DataLine /></el-icon>
            <span>统计报表</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <span class="system-title">工业产线设备运维工单协同系统</span>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ userStore.user?.realName || '用户' }}
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

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useAlertStore } from '../store'
import { alertApi } from '../api'
import { connectWebSocket } from '../utils/websocket'
import { 
  Tools, Odometer, Document, Plus, Monitor, Check, 
  Calendar, BellFilled, User, ArrowDown, DataLine
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const alertStore = useAlertStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(async () => {
  connectWebSocket()
  const alerts = await alertApi.getUnread()
  alertStore.setAlerts(alerts)
})
</script>

<style scoped>
.sidebar {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: bold;
  background-color: #263445;
  gap: 8px;
}

.logo .el-icon {
  font-size: 24px;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left .system-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  gap: 8px;
}

.main-content {
  background-color: #f5f7fa;
  overflow-y: auto;
}

.badge {
  margin-left: 10px;
}
</style>
