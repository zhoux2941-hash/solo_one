<template>
  <div class="app-container">
    <el-container style="height: 100vh">
      <el-aside width="220px" style="background-color: #2c3e50">
        <div class="logo">
          <h2 style="color: white; margin: 0; padding: 20px; text-align: center">IPTV监控系统</h2>
        </div>
        <el-menu
          :default-active="$route.path"
          class="el-menu-vertical-demo"
          background-color="#2c3e50"
          text-color="#bdc3c7"
          active-text-color="#3498db"
          router
        >
          <el-menu-item index="/">
            <el-icon><Monitor /></el-icon>
            <span>流监控</span>
          </el-menu-item>
          <el-menu-item index="/recordings">
            <el-icon><VideoCamera /></el-icon>
            <span>录制管理</span>
          </el-menu-item>
          <el-menu-item index="/analyze">
            <el-icon><DataAnalysis /></el-icon>
            <span>TS文件分析</span>
          </el-menu-item>
          <el-menu-item index="/alerts">
            <el-icon><Warning /></el-icon>
            <span>历史告警</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header style="background-color: white; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center">
          <h3 style="margin: 0">{{ currentPageTitle }}</h3>
          <div>
            <el-badge :value="unacknowledgedAlerts" :hidden="unacknowledgedAlerts === 0" class="item">
              <el-button type="danger" @click="goToAlerts" plain>
                <el-icon><Bell /></el-icon>
                告警
              </el-button>
            </el-badge>
          </div>
        </el-header>
        <el-main style="background-color: #f5f7fa">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlertStore } from './stores/alert'

const route = useRoute()
const router = useRouter()
const alertStore = useAlertStore()

const currentPageTitle = computed(() => {
  const titles = {
    '/': '流监控',
    '/recordings': '录制管理',
    '/analyze': 'TS文件分析',
    '/alerts': '历史告警'
  }
  return titles[route.path] || 'IPTV监控系统'
})

const unacknowledgedAlerts = computed(() => alertStore.unacknowledgedCount)

const goToAlerts = () => {
  router.push('/alerts')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.app-container {
  height: 100%;
}

.el-aside {
  overflow: hidden;
}

.el-menu-vertical-demo {
  border-right: none;
}

.logo {
  border-bottom: 1px solid #34495e;
}
</style>
