<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon :size="24" style="color: #ffd04b"><Bee /></el-icon>
        <span>养蜂场管理</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        router
        class="menu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>首页概览</span>
        </el-menu-item>
        <el-menu-item index="/beehives">
          <el-icon><Box /></el-icon>
          <span>蜂箱管理</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Edit /></el-icon>
          <span>数据记录</span>
        </el-menu-item>
        <el-menu-item index="/health">
          <el-icon><DocumentChecked /></el-icon>
          <span>健康评分</span>
        </el-menu-item>
        <el-menu-item index="/blooming">
          <el-icon><Sunny /></el-icon>
          <span>花期预测</span>
        </el-menu-item>
        <el-menu-item index="/comparison">
          <el-icon><DataLine /></el-icon>
          <span>蜂箱对比</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="title">{{ route.meta.title || '养蜂场管理系统' }}</span>
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
const currentRoute = computed(() => route.path)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.main {
  background-color: #f5f7fa;
  padding: 24px;
}
</style>
