<template>
    <el-container style="height: 100vh">
        <el-aside width="200px" style="background-color: #304156">
            <div class="logo">
                <h3>考试管理系统</h3>
            </div>
            <el-menu
                :default-active="$route.path"
                router
                background-color="#304156"
                text-color="#bfcbd9"
                active-text-color="#409eff"
            >
                <el-menu-item index="/admin/dashboard">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>数据统计</span>
                </el-menu-item>
                <el-menu-item index="/admin/questions">
                    <el-icon><Document /></el-icon>
                    <span>题库管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/papers">
                    <el-icon><Tickets /></el-icon>
                    <span>试卷管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/sessions">
                    <el-icon><Calendar /></el-icon>
                    <span>考试管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/records">
                    <el-icon><List /></el-icon>
                    <span>成绩查询</span>
                </el-menu-item>
                <el-menu-item index="/admin/users">
                    <el-icon><User /></el-icon>
                    <span>用户管理</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-container>
            <el-header style="background: white; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center">
                <span style="font-size: 18px; font-weight: bold">管理员后台</span>
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
import { DataAnalysis, Document, Tickets, Calendar, List, User } from '@element-plus/icons-vue'

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
