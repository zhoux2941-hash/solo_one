<template>
  <div id="app">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <span class="logo">🍰 下午茶拼单</span>
          <div class="user-info">
            <el-tag v-if="currentUser" type="primary" effect="light">
              {{ currentUser.name }}
            </el-tag>
            <el-button v-else size="small" type="primary" @click="showLoginDialog = true">
              登录
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main class="main">
        <router-view :key="$route.fullPath" />
      </el-main>
    </el-container>
    
    <el-dialog v-model="showLoginDialog" title="用户登录" width="400px">
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="loginForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="loginForm.userId" placeholder="请输入工号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="handleLogin">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const showLoginDialog = ref(false)
const currentUser = ref(null)

const loginForm = ref({
  name: '',
  userId: ''
})

onMounted(() => {
  const savedUser = localStorage.getItem('group-order-user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  } else {
    showLoginDialog.value = true
  }
})

const handleLogin = () => {
  if (!loginForm.value.name || !loginForm.value.userId) {
    ElMessage.warning('请填写姓名和工号')
    return
  }
  currentUser.value = { ...loginForm.value }
  localStorage.setItem('group-order-user', JSON.stringify(currentUser.value))
  showLoginDialog.value = false
  ElMessage.success('登录成功')
}

const logout = () => {
  localStorage.removeItem('group-order-user')
  currentUser.value = null
  showLoginDialog.value = true
}
</script>

<style scoped>
#app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}
</style>
