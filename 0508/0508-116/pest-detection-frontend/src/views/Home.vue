<template>
  <div class="home-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon :size="32" color="#67c23a"><Bug /></el-icon>
          <span class="title">病虫害上报系统</span>
        </div>
        <div class="header-right">
          <template v-if="user">
            <span class="user-info">欢迎，{{ user.name }} ({{ user.role === 'FARMER' ? '农户' : '专家' }})</span>
            <el-button type="primary" size="small" @click="goToDashboard">进入工作台</el-button>
            <el-button size="small" @click="logout">退出</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-card class="banner-card">
              <div class="banner">
                <h1>智慧农业 · 远程诊断</h1>
                <p>农户上报病虫害，专家在线诊断，助力农业发展</p>
              </div>
            </el-card>

            <el-card class="recent-card" style="margin-top: 20px">
              <template #header>
                <div class="card-header">
                  <el-icon><TrendCharts /></el-icon>
                  <span>最近上报记录</span>
                  <el-tag type="info" size="small">Redis缓存 · 最近10条</el-tag>
                </div>
              </template>
              <el-table :data="recentList" v-loading="loading" stripe>
                <el-table-column prop="farmerName" label="农户" width="120" />
                <el-table-column prop="cropType" label="作物类型" width="100" />
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reportTime" label="上报时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.reportTime) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!loading && recentList.length === 0" description="暂无上报记录" />
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="menu-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Menu /></el-icon>
                  <span>功能导航</span>
                </div>
              </template>
              <el-menu mode="vertical" :default-active="activeMenu" @select="handleMenuSelect">
                <el-menu-item index="knowledge">
                  <el-icon><Reading /></el-icon>
                  <span>知识库</span>
                </el-menu-item>
                <el-menu-item index="stats">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>数据统计</span>
                </el-menu-item>
                <el-menu-item index="login" v-if="!user">
                  <el-icon><User /></el-icon>
                  <span>用户登录</span>
                </el-menu-item>
                <el-menu-item index="register" v-if="!user">
                  <el-icon><UserFilled /></el-icon>
                  <span>用户注册</span>
                </el-menu-item>
              </el-menu>
            </el-card>

            <el-card class="info-card" style="margin-top: 20px">
              <template #header>
                <div class="card-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>使用说明</span>
                </div>
              </template>
              <div class="info-content">
                <p>1. 农户注册登录后可上报病虫害</p>
                <p>2. 支持上传最多3张图片</p>
                <p>3. 专家登录后查看待诊断列表</p>
                <p>4. 农户可对诊断结果评价</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecentReports } from '@/api/report'
import { ElMessage } from 'element-plus'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const recentList = ref([])
const loading = ref(false)
const activeMenu = ref('')

const loadRecent = async () => {
  loading.value = true
  try {
    const res = await getRecentReports()
    recentList.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const statusType = (status) => {
  const map = { PENDING: 'warning', DIAGNOSED: 'primary', EVALUATED: 'success' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { PENDING: '待诊断', DIAGNOSED: '已诊断', EVALUATED: '已评价' }
  return map[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const handleMenuSelect = (index) => {
  if (index === 'knowledge') {
    router.push('/knowledge')
  } else if (index === 'stats') {
    router.push('/stats')
  } else if (index === 'login') {
    router.push('/login')
  } else if (index === 'register') {
    router.push('/register')
  }
}

const goToDashboard = () => {
  if (user.value.role === 'FARMER') {
    router.push('/farmer')
  } else {
    router.push('/expert')
  }
}

const logout = () => {
  localStorage.removeItem('user')
  user.value = null
  ElMessage.success('已退出登录')
}

onMounted(() => {
  loadRecent()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  color: #606266;
  font-size: 14px;
}

.main-content {
  padding: 20px 40px;
}

.banner-card {
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
}

.banner {
  color: #fff;
  text-align: center;
  padding: 30px 0;
}

.banner h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.banner p {
  font-size: 16px;
  opacity: 0.9;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.card-header .el-tag {
  margin-left: auto;
}

.menu-card :deep(.el-menu) {
  border: none;
}

.info-content p {
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
}

.recent-card :deep(.el-card__header) {
  padding-bottom: 12px;
}
</style>