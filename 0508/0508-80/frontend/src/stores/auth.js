import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || '')

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials)
    if (response.data.success) {
      const data = response.data.data
      token.value = data.token
      user.value = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    return response.data
  }

  async function register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
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
    isLoggedIn,
    role,
    login,
    register,
    logout
  }
})
