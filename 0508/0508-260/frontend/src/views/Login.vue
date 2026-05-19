<template>
    <div class="login-container">
        <div class="login-box">
            <h2>在线考试系统</h2>
            <el-form :model="loginForm" label-width="80px">
                <el-form-item label="用户名">
                    <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleLogin" style="width: 100%">登录</el-button>
                </el-form-item>
            </el-form>
            <div class="tips">
                <p>管理员账号：admin / admin123</p>
                <p>考生账号：user1 / 123456</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
    username: '',
    password: ''
})

const handleLogin = async () => {
    if (!loginForm.value.username || !loginForm.value.password) {
        ElMessage.warning('请输入用户名和密码')
        return
    }

    try {
        const user = await login(loginForm.value)
        userStore.setUser(user)
        ElMessage.success('登录成功')
        if (user.role === 'ADMIN') {
            router.push('/admin/dashboard')
        } else {
            router.push('/examinee/exams')
        }
    } catch (error) {
        console.error(error)
    }
}
</script>

<style scoped>
.login-container {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-box h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
}

.tips {
    margin-top: 20px;
    padding: 15px;
    background: #f5f7fa;
    border-radius: 5px;
    font-size: 14px;
    color: #666;
}

.tips p {
    margin: 5px 0;
}
</style>
