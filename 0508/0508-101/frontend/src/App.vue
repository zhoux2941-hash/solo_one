<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="logo">校学生会经费管理系统</div>
        <el-menu 
          :default-active="activeMenu" 
          mode="horizontal" 
          @select="handleMenuSelect"
          class="menu"
        >
          <el-menu-item index="activities">活动管理</el-menu-item>
          <el-menu-item index="create">创建活动</el-menu-item>
          <el-menu-item index="stats">统计分析</el-menu-item>
        </el-menu>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    activeMenu() {
      const path = this.$route.path
      if (path === '/activities' || path === '/') return 'activities'
      if (path === '/create') return 'create'
      if (path === '/stats') return 'stats'
      return 'activities'
    }
  },
  methods: {
    handleMenuSelect(index) {
      this.$router.push('/' + index)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #409eff;
  display: flex;
  align-items: center;
  color: white;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
}

.menu {
  flex: 1;
  background-color: transparent;
  border-bottom: none;
}

.menu .el-menu-item {
  color: white;
  border-bottom: 2px solid transparent;
}

.menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu .el-menu-item.is-active {
  color: white;
  border-bottom-color: white;
}

.main {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
