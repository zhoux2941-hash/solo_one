<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #2f4050">
      <div style="color: white; padding: 20px; text-align: center; font-size: 18px; font-weight: bold">
        汽修管理系统
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#2f4050"
        text-color="#a7b1c2"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/customer">
          <el-icon><User /></el-icon>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item index="/vehicle">
          <el-icon><Van /></el-icon>
          <span>车辆档案</span>
        </el-menu-item>
        <el-menu-item index="/workorder">
          <el-icon><Document /></el-icon>
          <span>维修工单</span>
        </el-menu-item>
        <el-menu-item index="/part">
          <el-icon><Box /></el-icon>
          <span>配件库存</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #ffffff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 18px; font-weight: bold">{{ pageTitle }}</span>
        <span>欢迎使用汽修门店业务管理平台</span>
      </el-header>
      <el-main style="background-color: #f3f3f4">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, User, Van, Document, Box } from '@element-plus/icons-vue'

const route = useRoute()
const pageTitle = computed(() => {
  const titles = {
    '/': '数据看板',
    '/customer': '客户管理',
    '/vehicle': '车辆档案',
    '/workorder': '维修工单',
    '/part': '配件库存'
  }
  return titles[route.path] || '汽修管理系统'
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>