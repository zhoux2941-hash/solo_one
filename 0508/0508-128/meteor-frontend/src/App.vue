<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1 class="title">流星光谱数据库</h1>
          <el-menu mode="horizontal" :router="true" class="nav-menu">
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/upload">
              <el-icon><Upload /></el-icon>
              <span>上传光谱</span>
            </el-menu-item>
            <el-menu-item index="/velocity">
              <el-icon><Cpu /></el-icon>
              <span>速度估算</span>
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
import { HomeFilled, Upload, Cpu } from '@element-plus/icons-vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #1a1a2e;
  color: white;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.title {
  font-size: 20px;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  background-color: transparent;
  border-bottom: none;
}

.nav-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.7);
  border-bottom: none;
}

.nav-menu .el-menu-item:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-menu .el-menu-item.is-active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.main-content {
  padding: 20px;
}
</style>
