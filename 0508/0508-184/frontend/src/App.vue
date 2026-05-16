<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <el-header style="background: #409EFF; color: white; font-size: 20px; line-height: 60px; padding: 0 20px;">
        物业维修管理系统
      </el-header>
      <el-container>
        <el-aside width="200px" style="background: #f5f5f5;">
          <el-menu router default-active="1">
            <el-menu-item index="/orders">报修工单</el-menu-item>
            <el-menu-item index="/purchase-requests">采购申请</el-menu-item>
            <el-menu-item index="/reports">统计报表</el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
