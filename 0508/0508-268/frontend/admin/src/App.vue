<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <el-icon size="28" color="#409EFF"><Parking /></el-icon>
        <h1>智慧停车管理平台</h1>
      </div>
      <div class="header-right">
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="small">
          <el-icon size="14"><Connection /></el-icon>
          {{ wsConnected ? '实时连接' : '连接断开' }}
          <span v-if="reconnectCount > 0" style="margin-left: 8px">重连: {{ reconnectCount }}</span>
        </el-tag>
        <el-button type="primary" link @click="manualSync" v-if="wsConnected">
          <el-icon><Refresh /></el-icon>
          同步数据
        </el-button>
        <el-button type="warning" link @click="reconnect" v-else>
          <el-icon><Refresh /></el-icon>
          重新连接
        </el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/parking-lots">
            <el-icon><OfficeBuilding /></el-icon>
            <span>车场管理</span>
          </el-menu-item>
          <el-menu-item index="/parking-spaces">
            <el-icon><Grid /></el-icon>
            <span>车位管理</span>
          </el-menu-item>
          <el-menu-item index="/vehicles">
            <el-icon><Van /></el-icon>
            <span>车辆管理</span>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/rates">
            <el-icon><Money /></el-icon>
            <span>费率配置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useWebSocket } from './utils/websocket'

const route = useRoute()
const activeMenu = ref('/dashboard')
const wsConnected = ref(false)
const reconnectCount = ref(0)

let ws = null

const initWebSocket = () => {
  ws = useWebSocket('admin')
  
  ws.on('open', () => {
    wsConnected.value = true
    ElMessage.success('实时推送已连接')
  })
  
  ws.on('close', () => {
    wsConnected.value = false
    reconnectCount.value = ws.reconnectAttempts
  })
  
  ws.on('error', () => {
    wsConnected.value = false
  })
  
  ws.on('spaceUpdate', (data) => {
    window.dispatchEvent(new CustomEvent('space-update', { detail: data }))
  })
  
  ws.on('vehicleEntry', (data) => {
    window.dispatchEvent(new CustomEvent('vehicle-entry', { detail: data }))
  })
  
  ws.on('vehicleExit', (data) => {
    window.dispatchEvent(new CustomEvent('vehicle-exit', { detail: data }))
  })
}

const manualSync = () => {
  if (ws) {
    ws.fullSync()
  }
}

const reconnect = () => {
  if (ws) {
    ws.close()
  }
  reconnectCount.value = 0
  setTimeout(() => {
    initWebSocket()
  }, 500)
}

onMounted(() => {
  activeMenu.value = route.path
  initWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.aside {
  background: #545c64;
}

.main {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
