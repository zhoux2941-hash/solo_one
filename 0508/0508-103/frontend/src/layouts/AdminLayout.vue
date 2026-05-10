<template>
  <el-container class="admin-container">
    <el-aside width="200px" class="aside">
      <div class="logo">
        <el-icon><Trash /></el-icon>
        <span>智能垃圾桶</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin/resident">
          <el-icon><User /></el-icon>
          <span>居民管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/garbage">
          <el-icon><Box /></el-icon>
          <span>垃圾投递</span>
        </el-menu-item>
        <el-menu-item index="/admin/product">
          <el-icon><ShoppingBag /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/order">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/ranking">
          <el-icon><Trophy /></el-icon>
          <span>积分排行</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="title">智能垃圾桶管理系统</div>
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
.admin-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  height: 100vh;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b2f3a;
  gap: 8px;
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.main {
  background-color: #f0f2f5;
}
</style>
