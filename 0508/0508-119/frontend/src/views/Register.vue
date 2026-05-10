<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <el-icon class="logo-icon" size="48"><ChargingPile /></el-icon>
        <h1>用户注册</h1>
        <p>创建新账号</p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
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
        
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="确认密码" 
            size="large" 
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="realName">
          <el-input v-model="form.realName" placeholder="真实姓名" size="large" prefix-icon="UserFilled" />
        </el-form-item>
        
        <el-form-item prop="studentId">
          <el-input v-model="form.studentId" placeholder="学号（可选）" size="large" prefix-icon="Tickets" />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号（可选）" size="large" prefix-icon="Phone" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleRegister" style="width: 100%;">
            注册
          </el-button>
        </el-form-item>
        
        <div class="register-footer">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
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
  password: '',
  confirmPassword: '',
  realName: '',
  studentId: '',
  phone: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const registerData = {
        username: form.username,
        password: form.password,
        realName: form.realName,
        studentId: form.studentId || null,
        phone: form.phone || null
      }
      
      await userStore.handleRegister(registerData)
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (error) {
      console.error('Register error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  color: #409eff;
  margin-bottom: 10px;
}

.register-header h1 {
  margin: 10px 0;
  color: #303133;
  font-size: 24px;
}

.register-header p {
  color: #909399;
  margin: 0;
}

.register-form {
  margin-bottom: 20px;
}

.register-footer {
  text-align: center;
  color: #909399;
}

.register-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}
</style>
