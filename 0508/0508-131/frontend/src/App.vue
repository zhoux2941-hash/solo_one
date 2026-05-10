<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🎣 路亚钓鱼记录系统</h1>
        <el-menu
          :default-active="activeMenu"
          router
          mode="horizontal"
          class="nav-menu"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/record">
            <el-icon><Edit /></el-icon>
            <span>记录钓鱼</span>
          </el-menu-item>
          <el-menu-item index="/recommend">
            <el-icon><Star /></el-icon>
            <span>拟饵推荐</span>
          </el-menu-item>
          <el-menu-item index="/heatmap">
            <el-icon><Histogram /></el-icon>
            <span>鱼种热力图</span>
          </el-menu-item>
          <el-menu-item index="/spots">
            <el-icon><LocationFilled /></el-icon>
            <span>钓点地图</span>
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
import { HomeFilled, Edit, Star, Histogram, LocationFilled } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.app-title {
  color: #fff;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
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
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #4fc3f7;
  border-bottom-color: #4fc3f7;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
}
</style>
