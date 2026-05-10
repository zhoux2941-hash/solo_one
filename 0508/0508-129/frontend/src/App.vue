<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <span class="logo">⭐</span>
        <h1>变星观测亮度估计工具</h1>
        <span class="subtitle">Variable Star Observation Tool</span>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="side-menu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/stars">
            <el-icon><Star /></el-icon>
            <span>变星列表</span>
          </el-menu-item>
          <el-menu-item index="/observation">
            <el-icon><View /></el-icon>
            <span>观测记录</span>
          </el-menu-item>
          <el-menu-item index="/lightcurve">
            <el-icon><TrendCharts /></el-icon>
            <span>光变曲线</span>
          </el-menu-item>
          <el-menu-item index="/export">
            <el-icon><Download /></el-icon>
            <span>数据导出</span>
          </el-menu-item>
          <el-menu-item index="/period-detection">
            <el-icon><Aim /></el-icon>
            <span>周期检测</span>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo {
  font-size: 28px;
}

.app-header h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 12px;
  color: #aaa;
  margin-left: 10px;
}

.app-aside {
  background-color: #001529;
}

.side-menu {
  border-right: none;
  height: 100%;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
