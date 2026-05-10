<template>
  <el-container>
    <el-header class="app-header">
      <div class="logo">
        <el-icon :size="24"><WaterMonitor /></el-icon>
        <span class="title">办公楼饮水机监控系统</span>
      </div>
      <el-menu mode="horizontal" :router="true" :default-active="$route.path" background-color="#1f2937" text-color="#9ca3af" active-text-color="#fff">
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>实时监控</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>送水工单</span>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据分析</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><ShoppingCart /></el-icon>
          <span>备水提醒</span>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { WaterMonitor, Monitor, Document, DataAnalysis, ShoppingCart } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-header {
  background-color: #1f2937;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #374151;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 40px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.app-main {
  background-color: #f3f4f6;
  min-height: calc(100vh - 60px);
  padding: 24px;
}
</style>
