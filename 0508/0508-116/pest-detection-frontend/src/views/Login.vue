<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#67c23a"><Bug /></el-icon>
        <h2>用户登录</h2>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <div style="text-align: center; color: #909399">
            没有账号？<el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  phone: '',
  password: ''
})

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('user', JSON.stringify(res.data))
    ElMessage.success('登录成功')
    if (res.data.role === 'FARMER') {
      router.push('/farmer')
    } else {
      router.push('/expert')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #f1f8e9 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin-top: 10px;
  color: #303133;
}
</style>