import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)
  const nickname = computed(() => user.value?.nickname || user.value?.username)

  async function login(username, password) {
    const res = await userApi.login({ username, password })
    user.value = res.data
    return res.data
  }

  async function register(data) {
    const res = await userApi.register(data)
    user.value = res.data
    return res.data
  }

  async function fetchCurrentUser() {
    try {
      const res = await userApi.getCurrentUser()
      user.value = res.data
      return res.data
    } catch (e) {
      user.value = null
      return null
    }
  }

  async function logout() {
    try {
      await userApi.logout()
    } finally {
      user.value = null
    }
  }

  return {
    user,
    isLoggedIn,
    userId,
    nickname,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
