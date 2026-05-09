<template>
  <div class="home-container">
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon">📝</span>
        <span class="logo-text">Emotional Docs</span>
      </div>
      <div class="user-section" v-if="userStore.isLoggedIn">
        <span class="user-indicator" :style="{ backgroundColor: userStore.currentUser?.color }"></span>
        <span class="user-name">{{ userStore.currentUser?.username }}</span>
        <el-button type="text" @click="logout">退出</el-button>
      </div>
    </header>

    <main class="main-content">
      <div v-if="!userStore.isLoggedIn" class="login-section">
        <div class="login-card">
          <h1 class="welcome-title">欢迎使用 Emotional Docs</h1>
          <p class="welcome-desc">实时协作文档平台，智能分析您的写作情感变化</p>
          
          <el-form :model="loginForm" @submit.prevent="handleLogin" class="login-form">
            <el-form-item>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="loginForm.email"
                placeholder="请输入邮箱（可选）"
                size="large"
                prefix-icon="Message"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="userStore.isLoading"
                @click="handleLogin"
                class="login-btn"
              >
                开始使用
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-else class="dashboard-section">
        <div class="section-header">
          <h2>我的文档</h2>
          <el-button type="primary" @click="showCreateDialog = true" icon="Plus">
            新建文档
          </el-button>
        </div>

        <el-empty v-if="documents.length === 0" description="暂无文档，点击上方按钮创建">
          <el-button type="primary" @click="showCreateDialog = true">创建文档</el-button>
        </el-empty>

        <div v-else class="document-grid">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="document-card"
            @click="openDocument(doc.id)"
          >
            <div class="card-icon">📄</div>
            <h3 class="card-title">{{ doc.title }}</h3>
            <p class="card-meta">
              更新于 {{ formatDate(doc.updatedAt) }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <el-dialog
      v-model="showCreateDialog"
      title="创建新文档"
      width="400px"
    >
      <el-form :model="createForm">
        <el-form-item label="文档标题">
          <el-input
            v-model="createForm.title"
            placeholder="请输入文档标题"
            @keyup.enter="createDocument"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createDocument">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { documentApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  username: '',
  email: ''
})

const documents = ref([])
const showCreateDialog = ref(false)
const createForm = ref({
  title: ''
})
const creating = ref(false)

const handleLogin = async () => {
  if (!loginForm.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }

  try {
    await userStore.login(loginForm.value.username, loginForm.value.email)
    ElMessage.success('登录成功')
    loadDocuments()
  } catch (error) {
    ElMessage.error('登录失败，请重试')
  }
}

const logout = () => {
  userStore.logout()
  documents.value = []
  ElMessage.info('已退出登录')
}

const loadDocuments = async () => {
  if (!userStore.currentUser) return

  try {
    const response = await documentApi.getUserDocuments(userStore.currentUser.id)
    documents.value = response.data
  } catch (error) {
    console.error('Failed to load documents:', error)
  }
}

const createDocument = async () => {
  if (!createForm.value.title.trim()) {
    ElMessage.warning('请输入文档标题')
    return
  }

  creating.value = true
  try {
    const response = await documentApi.createDocument(
      createForm.value.title,
      userStore.currentUser.id
    )
    
    showCreateDialog.value = false
    createForm.value.title = ''
    
    ElMessage.success('文档创建成功')
    openDocument(response.data.id)
  } catch (error) {
    ElMessage.error('创建文档失败')
  } finally {
    creating.value = false
  }
}

const openDocument = (docId) => {
  router.push(`/document/${docId}`)
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  userStore.restoreUser()
  if (userStore.isLoggedIn) {
    loadDocuments()
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.user-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.user-name {
  font-weight: 500;
}

.main-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.login-section {
  display: flex;
  justify-content: center;
  padding-top: 80px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 420px;
  width: 100%;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 8px 0;
  text-align: center;
}

.welcome-desc {
  color: #6B7280;
  text-align: center;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.login-form {
  margin-top: 24px;
}

.login-btn {
  width: 100%;
}

.dashboard-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1F2937;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.document-card {
  background: #F9FAFB;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.document-card:hover {
  background: white;
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}
</style>
