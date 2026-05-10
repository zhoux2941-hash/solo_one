<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="logo">
          <el-icon><User /></el-icon>
          社团招新系统
        </div>
        <el-menu 
          :default-active="activeMenu" 
          mode="horizontal" 
          :router="true"
          class="menu"
        >
          <el-menu-item index="/register">
            <el-icon><Edit /></el-icon>
            报名表填写
          </el-menu-item>
          <el-menu-item index="/interview-list">
            <el-icon><Document /></el-icon>
            面试名单
          </el-menu-item>
          <el-menu-item index="/management">
            <el-icon><Setting /></el-icon>
            管理后台
          </el-menu-item>
        </el-menu>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html, #app {
  height: 100%;
  font-family: 'Microsoft YaHei', sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo {
  font-size: 22px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu {
  background: transparent;
  border-bottom: none;
}

.menu .el-menu-item {
  color: white;
  border-bottom: 2px solid transparent;
}

.menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu .el-menu-item.is-active {
  border-bottom-color: white;
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.main-content {
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
  padding: 24px;
}
</style>