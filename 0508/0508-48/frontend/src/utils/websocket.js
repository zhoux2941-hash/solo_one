import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.subscriptions = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      const socket = new SockJS('/ws')
      this.stompClient = Stomp.over(socket)
      this.stompClient.debug = () => {}

      this.stompClient.connect(
        {},
        (frame) => {
          console.log('WebSocket connected:', frame)
          this.connected = true
          this.reconnectAttempts = 0
          resolve()
        },
        (error) => {
          console.error('WebSocket connection error:', error)
          this.connected = false
          this.handleReconnect()
          reject(error)
        }
      )
    })
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => {
        this.connect().catch(() => {})
      }, this.reconnectDelay)
    } else {
      console.error('Max reconnect attempts reached')
    }
  }

  subscribe(destination, callback) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected, cannot subscribe')
      return null
    }

    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe()
    }

    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body)
        callback(data)
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
        callback(message.body)
      }
    })

    this.subscriptions.set(destination, subscription)
    return subscription
  }

  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe()
      this.subscriptions.delete(destination)
    }
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions.clear()

    if (this.stompClient) {
      this.stompClient.disconnect()
      this.stompClient = null
    }
    this.connected = false
  }

  isConnected() {
    return this.connected
  }
}

export const wsService = new WebSocketService()
export default WebSocketService
