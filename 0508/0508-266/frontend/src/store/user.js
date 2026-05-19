import { defineStore } from 'pinia'
import { login } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userId: null,
    username: '',
    realName: '',
    roleCode: '',
    deptName: ''
  }),

  actions: {
    async login(loginForm) {
      const res = await login(loginForm)
      this.token = res.data.token
      this.userId = res.data.userId
      this.username = res.data.username
      this.realName = res.data.realName
      this.roleCode = res.data.roleCode
      this.deptName = res.data.deptName
      localStorage.setItem('token', res.data.token)
      return res
    },

    logout() {
      this.token = ''
      this.userId = null
      this.username = ''
      this.realName = ''
      this.roleCode = ''
      this.deptName = ''
      localStorage.removeItem('token')
    }
  }
})
