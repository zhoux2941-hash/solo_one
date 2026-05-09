import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => currentUser.value !== null)

  async function login(username, email) {
    isLoading.value = true
    try {
      const response = await userApi.createUser(username, email || `${username}@example.com`)
      currentUser.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('user')
  }

  function restoreUser() {
    const saved = localStorage.getItem('user')
    if (saved) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to restore user:', e)
        localStorage.removeItem('user')
      }
    }
  }

  return {
    currentUser,
    isLoading,
    isLoggedIn,
    login,
    logout,
    restoreUser
  }
})
