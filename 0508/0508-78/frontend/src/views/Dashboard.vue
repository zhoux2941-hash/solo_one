<template>
  <div class="dashboard-container">
    <el-container>
      <el-header class="header">
        <div class="logo">🎬 影视剧组通告管理系统</div>
        <div class="user-info">
          <span>欢迎，{{ user?.name }}</span>
          <el-tag :type="roleTagType" size="small" style="margin-left: 10px">{{ roleName }}</el-tag>
          <el-button type="text" @click="logout" style="margin-left: 20px">退出登录</el-button>
        </div>
      </el-header>
      <el-main>
        <div class="welcome-card">
          <el-card>
            <h2>欢迎回来，{{ user?.name }}！</h2>
            <p class="subtitle">角色：{{ roleName }}</p>
            <el-divider />
            <div class="action-buttons">
              <router-link v-if="user?.role === 'DIRECTOR'" to="/director">
                <el-button type="primary" size="large">
                  <el-icon><Edit /></el-icon>
                  发布通告
                </el-button>
              </router-link>
              <router-link v-if="user?.role === 'ACTOR'" to="/actor">
                <el-button type="primary" size="large">
                  <el-icon><Calendar /></el-icon>
                  查看日程表
                </el-button>
              </router-link>
              <router-link v-if="user?.role === 'PRODUCTION_ASSISTANT'" to="/production">
                <el-button type="primary" size="large">
                  <el-icon><Check /></el-icon>
                  确认物资
                </el-button>
              </router-link>
            </div>
          </el-card>
        </div>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="8">
            <el-card class="info-card">
              <template #header>
                <div class="card-title">系统说明</div>
              </template>
              <div class="info-content">
                <p><strong>导演：</strong>创建和发布拍摄通告，选择演员和场景。</p>
                <p><strong>演员：</strong>查看个人日程表，系统自动检测时间冲突。</p>
                <p><strong>场务：</strong>查看当日通告，确认物资是否备齐。</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="info-card">
              <template #header>
                <div class="card-title">技术栈</div>
              </template>
              <div class="info-content">
                <p><strong>前端：</strong>Vue3 + Vite + Element Plus</p>
                <p><strong>后端：</strong>Spring Boot 3.2 + JPA</p>
                <p><strong>数据库：</strong>MySQL + Redis</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="info-card">
              <template #header>
                <div class="card-title">核心特性</div>
              </template>
              <div class="info-content">
                <p>✅ 演员时间冲突自动检测</p>
                <p>✅ Redis缓存加速查询</p>
                <p>✅ 多角色权限管理</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Calendar, Check } from '@element-plus/icons-vue'

const router = useRouter()

const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))

const roleName = computed(() => {
  const roleMap = {
    'DIRECTOR': '导演',
    'ACTOR': '演员',
    'PRODUCTION_ASSISTANT': '场务'
  }
  return roleMap[user.value?.role] || user.value?.role
})

const roleTagType = computed(() => {
  const typeMap = {
    'DIRECTOR': 'danger',
    'ACTOR': 'success',
    'PRODUCTION_ASSISTANT': 'warning'
  }
  return typeMap[user.value?.role] || 'info'
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  color: white;
  display: flex;
  align-items: center;
}

.user-info .el-button {
  color: white;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-card h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.action-buttons {
  text-align: center;
  padding: 20px 0;
}

.card-title {
  font-weight: bold;
  color: #303133;
}

.info-content p {
  margin: 10px 0;
  color: #606266;
  line-height: 1.6;
}
</style>