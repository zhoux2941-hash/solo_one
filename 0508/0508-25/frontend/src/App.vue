<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-left">
        <el-icon class="mr-10" @click="toggleSidebar">
          <Fold v-if="!appStore.sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
        <span class="app-title">🐾 宠物寄养预约系统</span>
      </div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-info">
            <el-avatar :size="32" icon="User" />
            <span class="username">当前用户</span>
          </span>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside :width="appStore.sidebarCollapsed ? '64px' : '200px'">
        <el-menu
          :default-active="route.path"
          router
          :collapse="appStore.sidebarCollapsed"
          background-color="#f5f7fa"
          text-color="#303133"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>数据分析</template>
          </el-menu-item>
          <el-menu-item index="/pets">
            <el-icon><Dog /></el-icon>
            <template #title>宠物管理</template>
          </el-menu-item>
          <el-menu-item index="/booking">
            <el-icon><Tickets /></el-icon>
            <template #title>预约管理</template>
          </el-menu-item>
          <el-menu-item index="/calendar">
            <el-icon><Calendar /></el-icon>
            <template #title>预约日历</template>
          </el-menu-item>
          <el-menu-item index="/matching">
            <el-icon><MagicStick /></el-icon>
            <template #title>智能匹配</template>
          </el-menu-item>
          <el-menu-item index="/centers">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>寄养中心</template>
          </el-menu-item>
          <el-menu-item index="/price-suggestion">
            <el-icon><PriceTag /></el-icon>
            <template #title>价格调整</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const toggleSidebar = () => {
  appStore.toggleSidebar()
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
