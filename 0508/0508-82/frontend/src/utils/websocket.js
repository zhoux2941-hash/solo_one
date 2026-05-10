import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.subscriptions = {}
  }

  connect(onConnected, onError) {
    const socket = new SockJS('/ws-quiz')
    this.stompClient = Stomp.over(socket)
    this.stompClient.debug = () => {}

    this.stompClient.connect(
      {},
      () => {
        console.log('WebSocket connected')
        if (onConnected) onConnected()
      },
      (error) => {
        console.error('WebSocket error:', error)
        if (onError) onError(error)
      }
    )
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect()
      this.stompClient = null
    }
    this.subscriptions = {}
  }

  subscribe(destination, callback) {
    if (!this.stompClient) {
      console.error('WebSocket not connected')
      return null
    }

    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe()
    }

    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body)
        if (callback) callback(data)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })

    this.subscriptions[destination] = subscription
    return subscription
  }

  unsubscribe(destination) {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe()
      delete this.subscriptions[destination]
    }
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected
  }
}

export default new WebSocketService()
