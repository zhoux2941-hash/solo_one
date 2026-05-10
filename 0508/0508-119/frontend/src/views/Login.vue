<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon class="logo-icon" size="48"><ChargingPile /></el-icon>
        <h1>充电桩预约系统</h1>
        <p>学校电瓶车充电服务</p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码" 
            size="large" 
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width: 100%;">
            登录
          </el-button>
        </el-form-item>
        
        <div class="login-footer">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
      
      <div class="test-accounts">
        <p>测试账号：</p>
        <p>管理员: admin / 123456</p>
        <p>学生: student1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
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
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await userStore.handleLogin(form)
      ElMessage.success('登录成功')
      router.push('/piles')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  color: #409eff;
  margin-bottom: 10px;
}

.login-header h1 {
  margin: 10px 0;
  color: #303133;
  font-size: 24px;
}

.login-header p {
  color: #909399;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  color: #909399;
}

.login-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}

.test-accounts {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #909399;
}

.test-accounts p {
  margin: 4px 0;
}
</style>
