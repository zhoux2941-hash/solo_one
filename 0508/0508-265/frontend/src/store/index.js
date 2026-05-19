import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null
  }),
  actions: {
    login(userData) {
      this.user = userData
      this.token = 'dummy-token'
      localStorage.setItem('user', JSON.stringify(userData))
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
    },
    loadUser() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.user = JSON.parse(userStr)
      }
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role || ''
  }
})

export const useAlertStore = defineStore('alert', {
  state: () => ({
    alerts: [],
    unreadCount: 0
  }),
  actions: {
    addAlert(alert) {
      this.alerts.unshift(alert)
      if (!alert.readFlag) {
        this.unreadCount++
      }
    },
    setAlerts(alerts) {
      this.alerts = alerts
      this.unreadCount = alerts.filter(a => !a.readFlag).length
    },
    markAsRead(id) {
      const alert = this.alerts.find(a => a.id === id)
      if (alert && !alert.readFlag) {
        alert.readFlag = true
        this.unreadCount--
      }
    }
  }
})
