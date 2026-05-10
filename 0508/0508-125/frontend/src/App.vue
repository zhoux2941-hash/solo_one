<template>
  <div class="app-container">
    <el-container>
      <el-header class="header">
        <div class="logo">
          <el-icon size="24" color="#409EFF"><Location /></el-icon>
          <span>潮汐监测系统</span>
        </div>
        <el-menu 
          :default-active="activeMenu" 
          class="nav-menu" 
          mode="horizontal" 
          router
        >
          <el-menu-item index="/">
            <el-icon><Monitor /></el-icon>
            <span>潮汐监测</span>
          </el-menu-item>
          <el-menu-item index="/compare">
            <el-icon><DataLine /></el-icon>
            <span>日期对比</span>
          </el-menu-item>
        </el-menu>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
      
      <el-footer class="footer">
        <p>潮汐监测系统 - 教学演示版本 | 基于 Vue3 + Spring Boot + MySQL + Redis</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

.nav-menu {
  background: transparent;
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.9);
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.main-content {
  background: #f0f2f5;
  min-height: calc(100vh - 120px);
}

.footer {
  background: #303133;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}
</style>
