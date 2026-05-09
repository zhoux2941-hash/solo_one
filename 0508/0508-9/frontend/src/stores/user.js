import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/axios'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  
  const isLoggedIn = computed(() => !!currentUser.value)
  const isStudent = computed(() => currentUser.value?.role === 'STUDENT')
  const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')
  
  function init() {
    const stored = localStorage.getItem('user')
    if (stored) {
      currentUser.value = JSON.parse(stored)
    }
  }
  
  async function login(username, password) {
    const response = await axios.post('/user/login', { username, password })
    if (response.code === 200) {
      currentUser.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return true
    }
    return false
  }
  
  function logout() {
    currentUser.value = null
    localStorage.removeItem('user')
  }
  
  init()
  
  return {
    currentUser,
    isLoggedIn,
    isStudent,
    isTeacher,
    login,
    logout
  }
})
