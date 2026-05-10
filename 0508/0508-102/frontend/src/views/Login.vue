<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="login-title">施工进度打卡系统</h2>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
            size="large"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            size="large"
            show-password
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <div style="text-align: center; margin-top: 20px;">
          <el-link type="primary" @click="$router.push('/register')">还没有账号？立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../api'
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    ...mapActions(['login']),
    handleLogin() {
      this.$refs.loginFormRef.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          const res = await authAPI.login(this.loginForm)
          this.login({
            token: res.data.token,
            user: res.data.user
          })
          this.$message.success('登录成功')
          this.$router.push('/')
        } catch (error) {
          console.error('登录失败', error)
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>
