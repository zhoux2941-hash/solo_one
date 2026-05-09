<template>
  <div class="app-container">
    <header class="app-header" v-if="currentUser">
      <div class="logo">在线考试系统</div>
      <nav class="nav-menu">
        <router-link v-if="isStudent" to="/student/exams">我的考试</router-link>
        <router-link v-if="isTeacher" to="/teacher/exams">考试管理</router-link>
        <router-link v-if="isTeacher" to="/teacher/monitor">考试监控</router-link>
      </nav>
      <div class="user-info">
        <span>{{ currentUser.realName || currentUser.username }}</span>
        <button class="btn-logout" @click="logout">退出</button>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from './stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const currentUser = computed(() => userStore.currentUser)
const isStudent = computed(() => currentUser.value?.role === 'STUDENT')
const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>
