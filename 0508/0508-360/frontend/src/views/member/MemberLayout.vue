<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" style="background: #304156;">
      <div class="logo">
        <h3>团员端</h3>
      </div>
      <el-menu
        default-active="2"
        class="el-menu-vertical-demo"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/member/product">
          <i class="el-icon-goods"></i>
          <span slot="title">团购商品</span>
        </el-menu-item>
        <el-menu-item index="/member/order">
          <i class="el-icon-document"></i>
          <span slot="title">我的订单</span>
        </el-menu-item>
        <el-menu-item @click="logout" style="margin-top: 20px;">
          <i class="el-icon-switch-button"></i>
          <span slot="title">退出登录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: white; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 18px; font-weight: bold;">{{ $route.name }}</span>
        <span>欢迎，{{ user.name }}</span>
      </el-header>
      <el-main style="background: #f0f2f5;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'MemberLayout',
  data() {
    return {
      user: {}
    }
  },
  created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}')
  },
  methods: {
    logout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.$router.push('/login')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: white;
  background: #2b2f3a;
}
.logo h3 {
  margin: 0;
  font-size: 16px;
}
.el-menu {
  border-right: none;
}
</style>
