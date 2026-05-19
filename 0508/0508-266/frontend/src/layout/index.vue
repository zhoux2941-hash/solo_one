<template>
  <div class="layout-container">
    <el-container style="height: 100vh">
      <el-aside width="220px">
        <div class="logo">涉密装备管理系统</div>
        <el-menu
          :default-active="$route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="/equipment">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>装备管理</span>
            </template>
            <el-menu-item index="/equipment/list">装备台账</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="/approval">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>审批管理</span>
            </template>
            <el-menu-item index="/approval/my">我的申请</el-menu-item>
            <el-menu-item index="/approval/pending" v-if="['ADMIN', 'WAREHOUSE_KEEPER', 'AUDITOR'].includes(roleCode)">
              待我审批
            </el-menu-item>
            <el-menu-item index="/approval/history">审批记录</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="/log" v-if="['ADMIN', 'AUDITOR'].includes(roleCode)">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>日志审计</span>
            </template>
            <el-menu-item index="/log/operation">操作日志</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header style="background: #fff; display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 18px; font-weight: bold">涉密装备出入库管理系统</span>
          <div style="display: flex; align-items: center; gap: 20px">
            <span>欢迎，{{ realName }}（{{ roleName }}）</span>
            <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
          </div>
        </el-header>
        <el-main style="background: #f0f2f5">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const realName = computed(() => userStore.realName)
const roleCode = computed(() => userStore.roleCode)

const roleName = computed(() => {
  const map = {
    ADMIN: '系统管理员',
    WAREHOUSE_KEEPER: '库管专员',
    AUDITOR: '涉密审核员',
    OPERATOR: '一线领用人员'
  }
  return map[roleCode.value] || ''
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('退出成功')
    router.push('/login')
  })
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  background: #263445;
}
</style>
