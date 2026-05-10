import { ref } from 'vue'

const WS_READY_STATES = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'CLOSED'
}

class PlantWebSocketManager {
  constructor() {
    this.ws = null
    this.isManualClose = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 1000
    this.reconnectTimer = null
    this.messageListeners = new Set()
    this.connectionState = ref('disconnected')
    this.reconnectCount = ref(0)
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[WS] 已有连接，跳过', WS_READY_STATES[this.ws.readyState])
      return
    }

    this.isManualClose = false
    this._doConnect()
  }

  _doConnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] 达到最大重连次数，停止重连')
      this.connectionState.value = 'failed'
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/plants`

    console.log(`[WS] 正在连接... (尝试 ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
    this.connectionState.value = 'connecting'

    try {
      this.ws = new WebSocket(wsUrl)
    } catch (e) {
      console.error('[WS] 创建连接失败', e)
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      console.log('[WS] 连接已建立')
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
      this.connectionState.value = 'connected'
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WS] 收到消息:', data)
        this.messageListeners.forEach(listener => {
          try {
            listener(data)
          } catch (e) {
            console.error('[WS] 监听器执行错误:', e)
          }
        })
      } catch (e) {
        console.error('[WS] 消息解析失败:', e, event.data)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WS] 连接错误:', error)
      this.connectionState.value = 'error'
    }

    this.ws.onclose = (event) => {
      console.log(`[WS] 连接关闭: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`)
      this.connectionState.value = 'disconnected'

      if (!this.isManualClose) {
        this._scheduleReconnect()
      }
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    this.reconnectCount.value = this.reconnectAttempts

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
    console.log(`[WS] ${delay}ms 后尝试重连...`)

    this.reconnectTimer = setTimeout(() => {
      this._doConnect()
    }, delay)
  }

  disconnect() {
    this.isManualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      console.log('[WS] 主动关闭连接')
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }
    this.connectionState.value = 'disconnected'
  }

  addMessageListener(listener) {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  getState() {
    return this.connectionState
  }

  getReconnectCount() {
    return this.reconnectCount
  }
}

const wsManager = new PlantWebSocketManager()

export function usePlantWebSocket() {
  return {
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    addMessageListener: (listener) => wsManager.addMessageListener(listener),
    connectionState: wsManager.getState(),
    reconnectCount: wsManager.getReconnectCount()
  }
}
