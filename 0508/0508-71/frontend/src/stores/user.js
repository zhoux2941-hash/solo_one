import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || 0)
  const isPublisher = computed(() => role.value === 1)
  const isVoiceActor = computed(() => role.value === 2)

  async function login(loginForm) {
    const res = await request.post('/user/login', loginForm)
    token.value = res.data.token
    userInfo.value = res.data
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data))
    return res
  }

  async function register(registerForm) {
    const res = await request.post('/user/register', registerForm)
    token.value = res.data.token
    userInfo.value = res.data
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data))
    return res
  }

  async function refreshUserInfo() {
    const res = await request.get('/user/info')
    userInfo.value = res.data
    localStorage.setItem('userInfo', JSON.stringify(res.data))
    return res
  }

  function updateBalance(newBalance) {
    if (userInfo.value) {
      userInfo.value.balance = newBalance
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isPublisher,
    isVoiceActor,
    login,
    register,
    refreshUserInfo,
    updateBalance,
    logout
  }
})
