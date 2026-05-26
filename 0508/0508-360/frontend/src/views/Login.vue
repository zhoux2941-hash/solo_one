<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">社区生鲜团购系统</h2>
      <el-form :model="form" label-width="80px" @submit.native.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="form.role">
            <el-radio label="LEADER">团长</el-radio>
            <el-radio label="MEMBER">团员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="tips">
        <p>测试账号：</p>
        <p>团长：leader / 123456</p>
        <p>团员：member1 / 123456 或 member2 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: '',
        role: 'LEADER'
      }
    }
  },
  methods: {
    handleLogin() {
      if (!this.form.username || !this.form.password) {
        this.$message.warning('请输入用户名和密码')
        return
      }
      this.$http.post('/api/user/login', {
        username: this.form.username,
        password: this.form.password
      }).then(res => {
        if (res.data.code === 200) {
          const user = res.data.data.user
          if (user.role !== this.form.role) {
            this.$message.error('请选择正确的角色登录')
            return
          }
          localStorage.setItem('token', res.data.data.token)
          localStorage.setItem('user', JSON.stringify(user))
          if (user.role === 'LEADER') {
            this.$router.push('/leader/activity')
          } else {
            this.$router.push('/member/product')
          }
          this.$message.success('登录成功')
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(() => {
        this.$message.error('登录失败，请稍后重试')
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 400px;
}
.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
.tips {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 5px;
  font-size: 13px;
  color: #666;
}
.tips p {
  margin: 5px 0;
}
</style>
