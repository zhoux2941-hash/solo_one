<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon :size="28"><Target /></el-icon>
          <span class="title">法庭弹道分析工具</span>
        </div>
        <el-menu 
          :default-active="currentRoute" 
          mode="horizontal" 
          class="nav-menu"
          router
        >
          <el-menu-item index="/">
            <el-icon><Upload /></el-icon>
            <span>文件上传</span>
          </el-menu-item>
          <el-menu-item index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <span>弹道分析</span>
          </el-menu-item>
          <el-menu-item index="/cartridge">
            <el-icon><Picture /></el-icon>
            <span>弹壳比对</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon><Document /></el-icon>
            <span>历史记录</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'

const route = useRoute()

const currentRoute = computed(() => route.path)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
}

.app-container {
  height: 100%;
}

.app-header {
  background: linear-gradient(135deg, #1a1a5c 0%, #2c3e50 100%);
  padding: 0;
  height: 60px !important;
  line-height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.logo-section .title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
}

.nav-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.8);
  border-bottom: none;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-menu-item.is-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #409eff;
}

.app-main {
  background: #f5f7fa;
  padding: 20px;
  height: calc(100% - 60px);
}
</style>
