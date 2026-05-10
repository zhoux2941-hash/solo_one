<template>
  <div class="register-container">
    <el-card class="register-card">
      <div class="register-header">
        <el-icon class="logo-icon"><Microphone /></el-icon>
        <h2>注册账户</h2>
        <p>加入配音任务接单系统，开启您的配音之旅</p>
      </div>
      <el-form :model="registerForm" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="请输入昵称" size="large">
            <template #prefix><el-icon><Avatar /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" show-password>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="身份" prop="role">
          <el-radio-group v-model="registerForm.role" size="large">
            <el-radio :label="1">
              <el-icon><Briefcase /></el-icon> 甲方（发布任务）
            </el-radio>
            <el-radio :label="2">
              <el-icon><Headset /></el-icon> 配音员
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="handleRegister">注册</el-button>
        </el-form-item>
        <div class="login-link">
          已有账户？<router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  role: null
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 20, message: '昵称长度在1到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择身份', trigger: 'change' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value.validate()
    loading.value = true
    const { confirmPassword, ...submitData } = registerForm
    await userStore.register(submitData)
    ElMessage.success('注册成功')
    router.push('/tasks')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: calc(100vh - 104px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: -20px;
}

.register-card {
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 10px;
}

.register-header h2 {
  margin: 10px 0 5px;
  color: #303133;
}

.register-header p {
  color: #909399;
  font-size: 14px;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #909399;
}

.login-link a {
  color: #667eea;
}

:deep(.el-radio) {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
