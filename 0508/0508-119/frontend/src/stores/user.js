import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getCurrentUser } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  const handleLogin = async (loginData) => {
    const res = await login(loginData)
    token.value = res.data.token
    currentUser.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }

  const handleRegister = async (registerData) => {
    return await register(registerData)
  }

  const logout = () => {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const refreshUser = async () => {
    if (token.value) {
      try {
        const res = await getCurrentUser()
        currentUser.value = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      } catch (e) {
        logout()
      }
    }
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    handleLogin,
    handleRegister,
    logout,
    refreshUser
  }
})
