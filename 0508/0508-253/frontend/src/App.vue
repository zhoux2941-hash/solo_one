<template>
  <div id="app">
    <el-container style="height: 100vh">
      <el-header style="background: #001529; color: white; display: flex; align-items: center; padding: 0 20px">
        <h2 style="margin: 0">新兵军事训练科目考评管理系统</h2>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background: #001529">
          <el-menu
            :default-active="activeMenu"
            background-color="#001529"
            text-color="#fff"
            active-text-color="#409eff"
            router
          >
            <el-menu-item index="/subjects">
              <span>科目库管理</span>
            </el-menu-item>
            <el-menu-item index="/trainees">
              <span>人员建档</span>
            </el-menu-item>
            <el-menu-item index="/scores">
              <span>成绩录入</span>
            </el-menu-item>
            <el-menu-item index="/comprehensive">
              <span>综合评分</span>
            </el-menu-item>
            <el-menu-item index="/ranking">
              <span>成绩排名</span>
            </el-menu-item>
            <el-menu-item index="/weakness">
              <span>短板分析</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main style="background: #f0f2f5; padding: 20px">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    activeMenu() {
      return this.$route.path
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
html, body, #app {
  height: 100%;
}
</style>