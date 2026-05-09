<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        style="min-height: 100vh; border-right: none;"
      >
        <div style="height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: 600;">
          试剂管理系统
        </div>
        <el-menu-item index="/inventory">
          <el-icon><Box /></el-icon>
          <span>试剂库存</span>
        </el-menu-item>
        <el-menu-item index="/requisition">
          <el-icon><Document /></el-icon>
          <span>领用申请</span>
        </el-menu-item>
        <el-menu-item index="/approval" v-if="user.role === 'admin'">
          <el-icon><Check /></el-icon>
          <span>审批管理</span>
        </el-menu-item>
        <el-menu-item index="/trace">
          <el-icon><Search /></el-icon>
          <span>溯源查询</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <span class="header-title">{{ pageTitle }}</span>
        <div class="user-info">
          <el-tag :type="user.role === 'admin' ? 'danger' : 'success'">
            {{ user.role === 'admin' ? '管理员' : '教职工' }}
          </el-tag>
          <span>{{ user.name }}</span>
          <el-button type="primary" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="padding: 0;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Box, Document, Check, Search } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/inventory': '试剂库存管理',
    '/requisition': '领用申请管理',
    '/approval': '审批管理',
    '/trace': '溯源查询'
  }
  return titles[route.path] || '系统'
})

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>
