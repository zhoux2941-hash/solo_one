<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1><el-icon><Tools /></el-icon> 工业产线运维工单系统</h1>
        <p>Industrial Production Line Work Order Management System</p>
      </div>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p>测试账号：</p>
        <p>管理员：admin / admin123</p>
        <p>组长：leader / leader123</p>
        <p>运维：worker1 / worker123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { userApi } from '../api'
import { ElMessage } from 'element-plus'
import { Tools, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await userApi.login(loginForm)
        if (result.success) {
          userStore.login(result.user)
          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else {
          ElMessage.error(result.message || '登录失败')
        }
      } catch (error) {
        ElMessage.error('登录失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-header p {
  font-size: 14px;
  color: #999;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}

.login-tips {
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
}

.login-tips p {
  margin: 5px 0;
}
</style>
