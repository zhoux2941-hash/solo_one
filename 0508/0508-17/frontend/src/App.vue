<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo">
        <el-icon class="logo-icon"><OfficeBuilding /></el-icon>
        <span class="logo-text">共享工位预订系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        router
        class="nav-menu"
      >
        <el-menu-item index="/booking">
          <el-icon><Calendar /></el-icon>
          <span>工位预订</span>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据分析</span>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0 40px;
}

.logo {
  display: flex;
  align-items: center;
  color: white;
}

.logo-icon {
  font-size: 28px;
  margin-right: 12px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  border-bottom: 2px solid transparent;
}

.nav-menu :deep(.el-menu-item:hover) {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: white;
  border-bottom-color: white;
  background: rgba(255, 255, 255, 0.1);
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
}
</style>
