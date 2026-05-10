<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const userId = ref(localStorage.getItem('astro_user_id') || '')
const userName = ref(localStorage.getItem('astro_user_name') || '')
const showUserModal = ref(!userId.value || !userName.value)

const navLinks = [
  { path: '/', name: '首页' },
  { path: '/telescopes', name: '设备列表' },
  { path: '/my-bookings', name: '我的预约' },
  { path: '/images', name: '观测图像' }
]

onMounted(() => {
  if (!userId.value || !userName.value) {
    showUserModal.value = true
  }
})

const saveUserInfo = () => {
  if (userId.value.trim() && userName.value.trim()) {
    localStorage.setItem('astro_user_id', userId.value.trim())
    localStorage.setItem('astro_user_name', userName.value.trim())
    showUserModal.value = false
  }
}
</script>

<template>
  <div class="app">
    <nav>
      <div class="nav-container">
        <span class="nav-brand">🔭 天文望远镜预约系统</span>
        <div class="nav-links">
          <router-link 
            v-for="link in navLinks" 
            :key="link.path"
            :to="link.path" 
            class="nav-link"
            :class="{ active: route.path === link.path }"
          >
            {{ link.name }}
          </router-link>
        </div>
      </div>
    </nav>

    <main class="container">
      <router-view />
    </main>

    <div v-if="showUserModal" class="modal-overlay">
      <div class="modal card">
        <h2>设置用户信息</h2>
        <p>请先设置您的用户信息以便预约</p>
        <div class="form-group">
          <label class="form-label">用户ID</label>
          <input 
            v-model="userId" 
            type="text" 
            class="form-input" 
            placeholder="请输入用户ID"
          />
        </div>
        <div class="form-group">
          <label class="form-label">用户姓名</label>
          <input 
            v-model="userName" 
            type="text" 
            class="form-input" 
            placeholder="请输入您的姓名"
          />
        </div>
        <button class="btn btn-primary" @click="saveUserInfo">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  max-width: 400px;
  width: 90%;
}

.modal h2 {
  margin-bottom: 8px;
}

.modal p {
  margin-bottom: 20px;
}
</style>
