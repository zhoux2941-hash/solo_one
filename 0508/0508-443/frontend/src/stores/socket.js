import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { useAlertStore } from './alert'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
    streamMetrics: new Map(),
    lastUpdateTime: 0
  }),

  actions: {
    connect() {
      if (this.socket) {
        return
      }

      this.socket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      this.socket.on('connect', () => {
        this.isConnected = true
        console.log('Socket connected')
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
        console.log('Socket disconnected')
      })

      this.socket.on('allStreamMetrics', (allMetrics) => {
        this.lastUpdateTime = Date.now()
        allMetrics.forEach(metric => {
          this.streamMetrics.set(metric.streamId, metric)
        })
      })

      this.socket.on('streamMetrics', (data) => {
        this.lastUpdateTime = Date.now()
        this.streamMetrics.set(data.streamId, data)
      })

      this.socket.on('newAlert', (alert) => {
        const alertStore = useAlertStore()
        alertStore.addAlert(alert)
      })

      this.socket.on('recordingStarted', (data) => {
        console.log('Recording started:', data)
      })

      this.socket.on('recordingStopped', (data) => {
        console.log('Recording stopped:', data)
      })

      this.socket.on('recordingSegment', (data) => {
        console.log('New recording segment:', data)
      })
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
      }
    },

    getStreamMetrics(streamId) {
      return this.streamMetrics.get(streamId)
    },

    getAllMetrics() {
      return Array.from(this.streamMetrics.values())
    }
  }
})
