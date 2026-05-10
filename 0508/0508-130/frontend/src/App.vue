<template>
  <el-container class="app-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon size="32"><Promotion /></el-icon>
        <span>救灾物资模拟</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/forecast">
          <el-icon><TrendCharts /></el-icon>
          <span>需求预测</span>
        </el-menu-item>
        <el-menu-item index="/allocation">
          <el-icon><MapLocation /></el-icon>
          <span>物资分配</span>
        </el-menu-item>
        <el-menu-item index="/consumption">
          <el-icon><Timer /></el-icon>
          <span>消耗模拟</span>
        </el-menu-item>
        <el-menu-item index="/compare">
          <el-icon><Scale /></el-icon>
          <span>方案对比</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">救灾物资需求预测模拟培训系统</span>
      </el-header>
      <el-main class="main">
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

<style scoped>
.app-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  gap: 10px;
  border-bottom: 1px solid #1f2d3d;
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
