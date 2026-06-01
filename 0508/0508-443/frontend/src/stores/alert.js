import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    alerts: []
  }),

  getters: {
    unacknowledgedCount: (state) => {
      return state.alerts.filter(a => !a.acknowledged).length
    },

    sortedAlerts: (state) => {
      return [...state.alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  },

  actions: {
    addAlert(alert) {
      this.alerts.unshift(alert)
      
      const severityColors = {
        critical: 'red',
        high: 'orange',
        medium: 'yellow',
        low: 'blue'
      }

      ElNotification({
        title: '告警通知',
        message: `${alert.streamName || alert.streamAddress}: ${alert.message}`,
        type: severityColors[alert.severity] === 'red' ? 'error' : 
              severityColors[alert.severity] === 'orange' ? 'warning' : 'info',
        duration: 5000
      })
    },

    setAlerts(alerts) {
      this.alerts = alerts
    },

    acknowledgeAlert(alertId) {
      const alert = this.alerts.find(a => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
        alert.acknowledgedAt = new Date().toISOString()
      }
    },

    removeAlert(alertId) {
      const index = this.alerts.findIndex(a => a.id === alertId)
      if (index !== -1) {
        this.alerts.splice(index, 1)
      }
    }
  }
})
