import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getCurrentUser } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isHost = computed(() => user.value?.role === 'HOST')

  async function handleLogin(credentials) {
    const response = await login(credentials)
    token.value = response.data.token
    user.value = {
      id: response.data.id,
      username: response.data.username,
      role: response.data.role
    }
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    return response
  }

  async function handleRegister(credentials) {
    return await register(credentials)
  }

  async function fetchCurrentUser() {
    if (token.value) {
      try {
        const response = await getCurrentUser()
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(user.value))
      } catch (error) {
        logout()
      }
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    isHost,
    handleLogin,
    handleRegister,
    fetchCurrentUser,
    logout
  }
})
