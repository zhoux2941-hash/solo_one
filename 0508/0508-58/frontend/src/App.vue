<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><Medical /></el-icon>
        <span class="title">宠物医院疫苗管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        router
        class="nav-menu"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/stock">
          <el-icon><Warehouse /></el-icon>
          <span>疫苗库存</span>
        </el-menu-item>
        <el-menu-item index="/expiring">
          <el-icon><Warning /></el-icon>
          <span>有效期预警</span>
        </el-menu-item>
        <el-menu-item index="/use-vaccine">
          <el-icon><Edit /></el-icon>
          <span>使用疫苗</span>
        </el-menu-item>
        <el-menu-item index="/scrap-management">
          <el-icon><Delete /></el-icon>
          <span>报废管理</span>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  background-color: #545c64;
  padding: 0;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-left: 10px;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.app-main {
  padding: 20px;
  background-color: #f5f7fa;
}
</style>
