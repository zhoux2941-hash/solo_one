<template>
  <div class="booth-app">
    <div class="header">
      <div class="header-left">
        <el-icon size="30" color="#409EFF"><Parking /></el-icon>
        <h1>车场岗亭管理系统</h1>
      </div>
      <div class="header-right">
        <el-tag :type="wsConnected ? 'success' : 'danger'" size="small">
          <el-icon size="14"><Connection /></el-icon>
          {{ wsConnected ? '实时连接' : '连接断开' }}
        </el-tag>
        <span class="time">{{ currentTime }}</span>
        <el-button type="primary" link @click="manualSync" v-if="wsConnected">
          <el-icon><Refresh /></el-icon>
          同步
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="sidebar">
        <el-menu
        :default-active="activeMenu"
        router
        background-color="#16213e"
        text-color="#e94560"
        active-text-color="#fff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>实时监控</span>
        </el-menu-item>
        <el-menu-item index="/entry">
          <el-icon><ArrowDown /></el-icon>
          <span>车辆入场</span>
        </el-menu-item>
        <el-menu-item index="/exit">
          <el-icon><ArrowUp /></el-icon>
          <span>车辆离场</span>
        </el-menu-item>
        <el-menu-item index="/release">
          <el-icon><Unlock /></el-icon>
          <span>异常放行</span>
        </el-menu-item>
        <el-menu-item index="/visitor">
          <el-icon><User /></el-icon>
          <span>访客登记</span>
        </el-menu-item>
      </el-menu>
      </div>

      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useWebSocket } from './utils/websocket'

const route = useRoute()
const activeMenu = ref('/dashboard')
const wsConnected = ref(false)
const currentTime = ref('')

let ws = null
let timer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN')
}

const initWebSocket = () => {
  ws = useWebSocket('booth')
  
  ws.on('open', () => {
    wsConnected.value = true
    ElMessage.success('实时推送已连接')
  })
  
  ws.on('close', () => {
    wsConnected.value = false
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

onMounted(() => {
  activeMenu.value = route.path
  updateTime()
  timer = setInterval(updateTime, 1000)
  initWebSocket()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (ws) ws.close()
})
</script>

<style scoped>
.booth-app {
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
}

.header {
  height: 60px;
  background: #16213e;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #0f3460;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time {
  font-size: 16px;
  color: #409EFF;
  font-family: monospace;
}

.main-content {
  display: flex;
  height: calc(100vh - 60px);
}

.sidebar {
  width: 180px;
  background: #16213e;
  border-right: 1px solid #0f3460;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
