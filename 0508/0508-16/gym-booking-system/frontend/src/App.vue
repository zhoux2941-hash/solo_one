<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="logo">
          <el-icon :size="24" class="logo-icon"><Dumbbell /></el-icon>
          <span class="logo-text">健身房团课预约系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="nav-menu"
          mode="horizontal"
          router
        >
          <el-menu-item index="/">课程列表</el-menu-item>
          <el-menu-item index="/my-bookings">我的预约</el-menu-item>
          <el-menu-item index="/analytics">数据分析看板</el-menu-item>
        </el-menu>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-avatar :size="32">{{ currentUser.name.charAt(0) }}</el-avatar>
              <span class="user-name">{{ currentUser.name }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="user">{{ currentUser.name }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Dumbbell, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const currentUser = ref({
  id: 1,
  name: '会员张三'
})

const activeMenu = computed(() => route.path)

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessage.success('已退出登录')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
}

.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  color: #409eff;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  margin-left: 40px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  margin-left: 10px;
  color: #606266;
}

.el-dropdown-link {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-dropdown-link:hover {
  color: #409eff;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}
</style>
