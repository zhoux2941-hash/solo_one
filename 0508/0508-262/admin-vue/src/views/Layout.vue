<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">社区团购</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/group-activities">
          <el-icon><Promotion /></el-icon>
          <span>团购活动</span>
        </el-menu-item>
        <el-menu-item index="/stores">
          <el-icon><Shop /></el-icon>
          <span>门店管理</span>
        </el-menu-item>
        <el-menu-item index="/delivery-routes">
          <el-icon><Van /></el-icon>
          <span>配送路线</span>
        </el-menu-item>
        <el-menu-item index="/refunds">
          <el-icon><Refund /></el-icon>
          <span>退款管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <span>{{ userStore.userInfo.nickname || '用户' }}</span>
          <el-button type="text" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '')

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('退出成功')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100%;
}

.aside {
  background-color: #304156;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main {
  background: #f0f2f5;
  padding: 20px;
  min-height: calc(100vh - 60px);
}

.el-container:last-child {
  margin-left: 220px;
}
</style>