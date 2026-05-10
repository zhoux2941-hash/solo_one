<template>
  <el-container style="height: 100vh">
    <el-header class="header">
      <h1 class="title">🌿 园艺嫁接辅助系统</h1>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        mode="horizontal"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/compatibility">亲和度预测</el-menu-item>
        <el-menu-item index="/records">嫁接记录</el-menu-item>
        <el-menu-item index="/season">季节分析</el-menu-item>
        <el-menu-item index="/reminders">
          管理提醒
          <el-badge v-if="todayReminderCount > 0" :value="todayReminderCount" class="reminder-badge" />
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTodayReminders } from './api'

const route = useRoute()
const router = useRouter()
const todayReminderCount = ref(0)

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

const loadTodayReminders = async () => {
  try {
    const res = await getTodayReminders()
    todayReminderCount.value = res.data.length
  } catch (error) {
    console.error('加载今日提醒失败', error)
  }
}

onMounted(() => {
  loadTodayReminders()
})
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 0 30px;
}

.title {
  color: white;
  margin: 0 30px 0 0;
  font-size: 24px;
}

.menu {
  background: transparent;
  border: none;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  color: white;
  font-size: 16px;
}

.menu :deep(.el-menu-item:hover),
.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.reminder-badge {
  margin-left: 8px;
}
</style>
