<template>
    <el-container style="height: 100vh">
        <el-aside width="200px" style="background-color: #304156">
            <div class="logo">
                <h3>在线考试系统</h3>
            </div>
            <el-menu
                :default-active="$route.path"
                router
                background-color="#304156"
                text-color="#bfcbd9"
                active-text-color="#409eff"
            >
                <el-menu-item index="/examinee/exams">
                    <el-icon><Document /></el-icon>
                    <span>我的考试</span>
                </el-menu-item>
                <el-menu-item index="/examinee/records">
                    <el-icon><List /></el-icon>
                    <span>考试记录</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-container>
            <el-header style="background: white; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center">
                <span style="font-size: 18px; font-weight: bold">考生中心</span>
                <div style="display: flex; align-items: center; gap: 20px">
                    <span>欢迎，{{ user?.name }}</span>
                    <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
                </div>
            </el-header>
            <el-main style="background: #f0f2f5">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, List } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const user = userStore.user

const handleLogout = () => {
    userStore.logout()
    ElMessage.success('退出成功')
    router.push('/login')
}
</script>

<style scoped>
.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #1f2d3d;
}

.logo h3 {
    color: white;
    font-size: 16px;
}
</style>
