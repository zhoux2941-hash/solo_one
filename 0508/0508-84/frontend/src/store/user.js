import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getUserById } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || '')

  const isLogin = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const login = async (username, password) => {
    const res = await loginApi(username, password)
    user.value = res.data.user
    token.value = res.data.token
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
    return res
  }

  const register = async (username, password, realName, phone) => {
    return await registerApi(username, password, realName, phone)
  }

  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const refreshUser = async () => {
    if (user.value) {
      const res = await getUserById(user.value.id)
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    }
  }

  return {
    user,
    token,
    isLogin,
    isAdmin,
    login,
    register,
    logout,
    refreshUser
  }
})
