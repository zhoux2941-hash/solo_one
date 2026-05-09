<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">在线考试系统</h1>
      <p class="login-subtitle">请登录您的账户</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            type="text" 
            v-model="username" 
            class="form-input" 
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            type="password" 
            v-model="password" 
            class="form-input" 
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div v-if="error" class="mb-16" style="color: #ff4d4f; font-size: 14px;">
          {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="mt-24" style="margin-top: 24px; font-size: 12px; color: #999; text-align: center;">
        <p>测试账号：</p>
        <p>教师: teacher1 / 123456</p>
        <p>学生: student1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const userStore = useUserStore()
const router = useRouter()

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  try {
    const success = await userStore.login(username.value, password.value)
    if (success) {
      if (userStore.isTeacher) {
        router.push('/teacher/exams')
      } else {
        router.push('/student/exams')
      }
    } else {
      error.value = '用户名或密码错误'
    }
  } catch (e) {
    error.value = '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
