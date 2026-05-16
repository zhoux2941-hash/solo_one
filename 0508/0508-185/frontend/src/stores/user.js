import { defineStore } from 'pinia'
import { ref } from 'vue'
import userApi from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)

  const login = async (userId) => {
    try {
      const response = await userApi.getById(userId)
      currentUser.value = response.data
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const logout = () => {
    currentUser.value = null
  }

  return {
    currentUser,
    login,
    logout
  }
})
