<template>
  <div id="app">
    <header class="header">
      <h1>文档搜索分析系统</h1>
      <div class="nav">
        <router-link to="/" class="nav-link">
          <el-icon><Search /></el-icon> 文档搜索
        </router-link>
        <router-link to="/dashboard" class="nav-link">
          <el-icon><DataAnalysis /></el-icon> 数据分析
        </router-link>
      </div>
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { Search, DataAnalysis } from '@element-plus/icons-vue'
</script>

<style scoped>
.nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: white;
}

.nav-link.router-link-active {
  color: white;
  font-weight: 500;
}
</style>
