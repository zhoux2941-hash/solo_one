import { ElMessage } from 'element-plus'
import request from './request'

class ParkingWebSocket {
  constructor(clientType = 'booth') {
    this.clientType = clientType
    this.clientId = this.generateClientId()
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 20
    this.reconnectInterval = 3000
    this.heartbeatInterval = null
    this.isManualClose = false
    this.lastSyncTime = 0
    this.messageHandlers = new Map()
    
    this.connect()
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
    
    console.log('[WebSocket] 正在连接...', wsUrl)
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('[WebSocket] 连接成功')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.triggerHandler('open', {})
      
      if (this.lastSyncTime === 0) {
        this.fullSync()
      }
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
      console.log('[WebSocket] 连接关闭, 代码:', event.code, '原因:', event.reason)
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
        console.debug('[WebSocket] 收到PONG响应')
        break
      case 'CONNECTED':
        console.log('[WebSocket] 服务器确认连接, 在线数:', data.onlineCount)
        ElMessage.success('实时推送已连接')
        break
      case 'PARKING_SPACE_UPDATE':
        console.log('[WebSocket] 车位状态更新:', data)
        this.triggerHandler('spaceUpdate', data)
        break
      case 'VEHICLE_ENTRY':
        console.log('[WebSocket] 车辆入场:', data)
        this.triggerHandler('vehicleEntry', data)
        break
      case 'VEHICLE_EXIT':
        console.log('[WebSocket] 车辆离场:', data)
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
    }, 10000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 已达最大重连次数, 停止重连')
      ElMessage.error('实时推送连接失败, 请刷新页面')
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

  async fullSync() {
    try {
      const res = await request.get('/ws/sync/full', {
        params: { lastSyncTime: this.lastSyncTime }
      })
      
      if (res.code === 200 && res.data) {
        console.log('[WebSocket] 全量同步完成, 数据:', res.data)
        this.triggerHandler('fullSync', res.data)
        this.lastSyncTime = res.data.syncTime
        ElMessage.success('数据同步完成')
      }
    } catch (error) {
      console.error('[WebSocket] 全量同步失败:', error)
    }
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

  getStatus() {
    if (!this.ws) return 'DISCONNECTED'
    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']
    return states[this.ws.readyState] || 'UNKNOWN'
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

let instance = null

export function useWebSocket(clientType = 'booth') {
  if (!instance) {
    instance = new ParkingWebSocket(clientType)
  }
  return instance
}

export function disconnectWebSocket() {
  if (instance) {
    instance.close()
    instance = null
  }
}

export default ParkingWebSocket
