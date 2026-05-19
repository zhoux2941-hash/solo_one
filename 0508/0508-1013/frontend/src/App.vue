<template>
  <div class="app-container">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <div class="logo">
            <el-icon :size="32" color="#fff"><Monitor /></el-icon>
            <h1>幼儿园午睡体温监测系统</h1>
          </div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ffd04b"
            router
            class="nav-menu"
          >
            <el-menu-item index="/">
              <el-icon><Monitor /></el-icon>
              <span>实时监测</span>
            </el-menu-item>
            <el-menu-item index="/history">
              <el-icon><DataLine /></el-icon>
              <span>历史记录</span>
            </el-menu-item>
            <el-menu-item index="/abnormal">
              <el-icon><Warning /></el-icon>
              <span>异常告警</span>
            </el-menu-item>
          </el-menu>
        </div>
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
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.header {
  background: rgba(0, 0, 0, 0.2);
  padding: 0;
  height: 70px;
  line-height: 70px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.nav-menu {
  border-bottom: none;
  background: transparent;
}

.nav-menu :deep(.el-menu-item) {
  height: 70px;
  line-height: 70px;
  border-bottom: none;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  width: 100%;
}
</style>
