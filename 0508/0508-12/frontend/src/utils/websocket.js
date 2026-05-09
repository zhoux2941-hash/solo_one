import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.subscriptions = new Map()
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected && this.stompClient?.connected) {
        resolve()
        return
      }

      const socket = new SockJS('/ws')
      this.stompClient = Stomp.over(socket)
      this.stompClient.debug = () => {}

      this.stompClient.connect(
        {},
        (frame) => {
          this.connected = true
          console.log('WebSocket connected:', frame)
          resolve()
        },
        (error) => {
          console.error('WebSocket connection error:', error)
          this.connected = false
          reject(error)
        }
      )
    })
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        this.connected = false
        console.log('WebSocket disconnected')
      })
    }
  }

  subscribe(destination, callback) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected, cannot subscribe')
      return null
    }

    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body)
        callback(data)
      } catch (e) {
        console.error('Failed to parse message:', e)
        callback(message.body)
      }
    })

    this.subscriptions.set(destination, subscription)
    return subscription
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(destination)
    }
  }

  send(destination, body = {}) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected, cannot send')
      return
    }

    this.stompClient.send(destination, {}, JSON.stringify(body))
  }

  isConnected() {
    return this.connected && this.stompClient?.connected
  }
}

export default new WebSocketService()
