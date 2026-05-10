<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <el-icon :size="28"><Microscope /></el-icon>
          移液枪路径优化工具
        </h1>
        <div class="header-actions">
          <router-link to="/">
            <el-button type="primary">首页</el-button>
          </router-link>
          <router-link to="/tube-racks">
            <el-button>试管架</el-button>
          </router-link>
          <router-link to="/experiments">
            <el-button>实验方案</el-button>
          </router-link>
          <router-link to="/optimize">
            <el-button>路径优化</el-button>
          </router-link>
        </div>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
    <el-footer class="app-footer">
      <p>&copy; 2026 生物实验室辅助工具 | Vue3 + Java + MySQL + Redis</p>
    </el-footer>
  </el-container>
</template>

<script setup>
</script>

<style scoped lang="scss">
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 0;
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20px;
  }
  
  .app-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 600;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
}

.app-footer {
  text-align: center;
  padding: 15px;
  background: white;
  border-top: 1px solid #e4e7ed;
  color: #909399;
  font-size: 14px;
}
</style>