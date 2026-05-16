<template>
  <div id="app">
    <el-container style="height: 100vh">
      <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px">
        <h2 style="margin: 0">奖金分配管理系统</h2>
        <div style="display: flex; gap: 20px; align-items: center">
          <el-select v-model="selectedUserId" @change="switchUser" size="small" style="width: 150px">
            <el-option label="切换用户" :value="null" disabled />
            <el-option label="HR管理员" :value="1" />
            <el-option label="张经理" :value="2" />
            <el-option label="员工1" :value="3" />
            <el-option label="员工2" :value="4" />
            <el-option label="员工3" :value="5" />
          </el-select>
          <span>{{ currentUser?.name }} - {{ roleText }}</span>
          <el-button type="primary" link @click="logout" style="color: white">退出</el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background: #f5f5f5">
          <el-menu
            :default-active="activeMenu"
            router
            style="border-right: none"
          >
            <template v-if="currentUser?.role === 'MANAGER' || currentUser?.role === 'HR'">
              <el-menu-item index="/manager/pools">
                <span>奖金池管理</span>
              </el-menu-item>
              <el-menu-item index="/manager/appeals">
                <span>申诉处理</span>
              </el-menu-item>
            </template>
            <template v-if="currentUser?.role === 'EMPLOYEE' || currentUser?.role === 'HR'">
              <el-menu-item index="/employee/bonus">
                <span>我的奖金</span>
              </el-menu-item>
            </template>
            <el-menu-item index="/reports">
              <span>报表查询</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main style="padding: 20px">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentUser = computed(() => userStore.currentUser)
const activeMenu = computed(() => route.path)
const selectedUserId = ref(2)

const roleText = computed(() => {
  const roles = { EMPLOYEE: '员工', MANAGER: '主管', HR: 'HR管理员' }
  return roles[currentUser.value?.role] || ''
})

const switchUser = async (userId) => {
  try {
    await userStore.login(userId)
    ElMessage.success(`已切换到：${currentUser.value?.name}`)
    router.push('/manager/pools')
  } catch (error) {
    ElMessage.error('切换用户失败')
  }
}

const logout = () => {
  userStore.logout()
  window.location.href = '/login'
}

onMounted(() => {
  if (!userStore.currentUser) {
    userStore.login(2)
  } else {
    selectedUserId.value = userStore.currentUser.id
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}
</style>
