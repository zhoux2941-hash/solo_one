<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon class="logo-icon"><Music /></el-icon>
        <span>音乐节调度系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-menu-item v-if="isVolunteer" index="/positions">
          <el-icon><Postcard /></el-icon>
          <span>岗位申请</span>
        </el-menu-item>
        <el-menu-item v-if="isVolunteer" index="/my-applications">
          <el-icon><Document /></el-icon>
          <span>我的申请</span>
        </el-menu-item>
        <el-menu-item v-if="isVolunteer" index="/my-schedules">
          <el-icon><Calendar /></el-icon>
          <span>我的排班</span>
        </el-menu-item>
        <el-menu-item v-if="isVolunteer" index="/shift-swap">
          <el-icon><Switch /></el-icon>
          <span>换班申请</span>
        </el-menu-item>
        
        <el-menu-item v-if="isLeaderOrAdmin" index="/leader/applications">
          <el-icon><List /></el-icon>
          <span>申请审核</span>
        </el-menu-item>
        <el-menu-item v-if="isLeaderOrAdmin" index="/leader/schedules">
          <el-icon><Edit /></el-icon>
          <span>排班管理</span>
        </el-menu-item>
        
        <el-menu-item v-if="isAdmin" index="/admin/positions">
          <el-icon><Setting /></el-icon>
          <span>岗位管理</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/checkin-stats">
          <el-icon><DataAnalysis /></el-icon>
          <span>签到统计</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin/heat-map">
          <el-icon><TrendCharts /></el-icon>
          <span>岗位热度图</span>
        </el-menu-item>
        
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知中心</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="badge" />
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ authStore.user?.name }}</span>
              <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import { getRoleLabel } from '@/utils/constants'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const unreadCount = ref(0)

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '首页')

const isVolunteer = computed(() => authStore.user?.role === 'VOLUNTEER')
const isLeaderOrAdmin = computed(() => 
  authStore.user?.role === 'LEADER' || authStore.user?.role === 'ADMIN'
)
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

const roleLabel = computed(() => getRoleLabel(authStore.user?.role))

const roleTagType = computed(() => {
  switch (authStore.user?.role) {
    case 'ADMIN': return 'danger'
    case 'LEADER': return 'warning'
    default: return 'success'
  }
})

async function fetchUnreadCount() {
  try {
    const response = await api.get('/volunteer/notifications/unread-count')
    if (response.data.success) {
      unreadCount.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {})
  }
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.aside {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.menu {
  border-right: none;
}

.badge {
  margin-left: 8px;
}

.header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 12px;
  color: #303133;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
