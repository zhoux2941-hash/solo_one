import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userId = ref(localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null)
  const username = ref(localStorage.getItem('username') || '')
  const realName = ref(localStorage.getItem('realName') || '')
  const creditScore = ref(localStorage.getItem('creditScore') ? Number(localStorage.getItem('creditScore')) : 0)

  const isLoggedIn = computed(() => !!token.value)

  const login = (data) => {
    token.value = data.token
    userId.value = data.userId
    username.value = data.username
    realName.value = data.realName
    creditScore.value = data.creditScore

    localStorage.setItem('token', data.token)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('username', data.username)
    localStorage.setItem('realName', data.realName)
    localStorage.setItem('creditScore', String(data.creditScore))
  }

  const logout = () => {
    token.value = ''
    userId.value = null
    username.value = ''
    realName.value = ''
    creditScore.value = 0

    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('realName')
    localStorage.removeItem('creditScore')
  }

  const updateCreditScore = (score) => {
    creditScore.value = score
    localStorage.setItem('creditScore', String(score))
  }

  return {
    token,
    userId,
    username,
    realName,
    creditScore,
    isLoggedIn,
    login,
    logout,
    updateCreditScore
  }
})
