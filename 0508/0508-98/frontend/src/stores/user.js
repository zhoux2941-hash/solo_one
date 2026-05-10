import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isStudent: (state) => state.userInfo?.role === 'STUDENT',
    isCoach: (state) => state.userInfo?.role === 'COACH'
  },

  actions: {
    async login(username, password) {
      const res = await request({
        url: '/auth/login',
        method: 'post',
        data: { username, password }
      })
      this.token = res.data.token
      this.userInfo = {
        userId: res.data.userId,
        username: res.data.username,
        name: res.data.name,
        role: res.data.role,
        coachId: res.data.coachId
      }
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      return res.data
    },

    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})