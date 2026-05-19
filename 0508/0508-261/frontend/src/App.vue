<template>
  <div id="app">
    <el-container style="height: 100vh; border: 1px solid #eee">
      <el-header style="text-align: right; font-size: 12px; background: #409EFF; color: #fff; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 20px; font-weight: bold;">
          <el-icon style="margin-right: 10px;"><Document /></el-icon>
          订单履约中台
        </div>
        <div style="font-size: 14px;">
          <span>欢迎，管理员</span>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
          <el-menu :default-active="$route.path" router>
            <el-menu-item index="/">
              <el-icon><ShoppingCart /></el-icon>
              <span>订单列表</span>
            </el-menu-item>
            <el-menu-item index="/create">
              <el-icon><Plus /></el-icon>
              <span>创建订单</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { Document, ShoppingCart, Plus } from '@element-plus/icons-vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>