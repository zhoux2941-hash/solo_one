import { showToast } from 'vant'
import request from './request'

class ParkingWebSocket {
  constructor(clientType = 'h5') {
    this.clientType = clientType
    this.clientId = this.generateClientId()
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectInterval = 5000
    this.heartbeatInterval = null
    this.isManualClose = false
    this.lastSyncTime = 0
    this.messageHandlers = new Map()
  }

  generateClientId() {
    return `${this.clientType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.isManualClose = false
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws/parking/${this.clientType}/${this.clientId}`
    
    console.log('[WebSocket] 正在连接...')
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('[WebSocket] 连接成功')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.triggerHandler('open', {})
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('[WebSocket] 消息解析失败:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error)
      this.triggerHandler('error', error)
    }

    this.ws.onclose = (event) => {
      console.log('[WebSocket] 连接关闭, 代码:', event.code)
      this.stopHeartbeat()
      this.triggerHandler('close', event)
      
      if (!this.isManualClose) {
        this.scheduleReconnect()
      }
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'PING':
        this.sendPong()
        break
      case 'PONG':
        break
      case 'CONNECTED':
        console.log('[WebSocket] 服务器确认连接')
        break
      case 'PARKING_SPACE_UPDATE':
        this.triggerHandler('spaceUpdate', data)
        break
      case 'VEHICLE_ENTRY':
        this.triggerHandler('vehicleEntry', data)
        break
      case 'VEHICLE_EXIT':
        this.triggerHandler('vehicleExit', data)
        break
      default:
        this.triggerHandler('message', data)
    }
    
    this.lastSyncTime = Math.max(this.lastSyncTime, data.timestamp || Date.now())
  }

  sendPong() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: Date.now()
      }))
    }
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'PING',
          timestamp: Date.now()
        }))
      }
    }, 15000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 已达最大重连次数')
      return
    }

    const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    
    console.log(`[WebSocket] ${delay/1000}秒后进行第${this.reconnectAttempts}次重连...`)
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect()
      }
    }, delay)
  }

  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, [])
    }
    this.messageHandlers.get(event).push(handler)
  }

  off(event, handler) {
    if (this.messageHandlers.has(event)) {
      const handlers = this.messageHandlers.get(event)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  triggerHandler(event, data) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[WebSocket] 事件处理错误 ${event}:`, error)
        }
      })
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  close() {
    this.isManualClose = true
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

let instance = null

export function useWebSocket(clientType = 'h5') {
  if (!instance) {
    instance = new ParkingWebSocket(clientType)
  }
  return instance
}

export function connectWebSocket() {
  if (!instance) {
    instance = new ParkingWebSocket('h5')
  }
  instance.connect()
  return instance
}

export function disconnectWebSocket() {
  if (instance) {
    instance.close()
    instance = null
  }
}

export default ParkingWebSocket
