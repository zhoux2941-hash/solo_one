<template>
  <div class="form-container">
    <h2 class="page-title" style="text-align: center; margin-bottom: 30px;">用户登录</h2>
    <el-form :model="form" :rules="rules" ref="form" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" style="width: 100%;" @click="handleLogin" :loading="loading">登录</el-button>
      </el-form-item>
      <el-form-item style="text-align: center; margin-bottom: 0;">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        
        this.loading = true
        try {
          await this.$store.dispatch('login', this.form)
          this.$message.success('登录成功')
          this.$router.push('/')
        } catch (e) {
          this.$message.error(e.message)
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>
