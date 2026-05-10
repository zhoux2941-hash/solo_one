class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.reconnectCount = 0
    this.maxReconnect = 10
    this.messageHandlers = {}
    this.userId = null
  }

  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    this.userId = userId
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/notification?userId=${userId}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功')
        this.reconnectCount = 0
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WebSocket] 收到消息:', data)
          if (data.type && this.messageHandlers[data.type]) {
            this.messageHandlers[data.type].forEach((handler) => handler(data))
          }
          if (this.messageHandlers['*']) {
            this.messageHandlers['*'].forEach((handler) => handler(data))
          }
        } catch (e) {
          console.error('[WebSocket] 消息解析失败:', e)
        }
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] 连接关闭')
        this.tryReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error)
      }
    } catch (e) {
      console.error('[WebSocket] 创建连接失败:', e)
      this.tryReconnect()
    }
  }

  tryReconnect() {
    if (this.reconnectCount >= this.maxReconnect) {
      console.log('[WebSocket] 达到最大重连次数，停止重连')
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.reconnectCount++
    const delay = Math.min(1000 * this.reconnectCount, 10000)

    console.log(`[WebSocket] 尝试第 ${this.reconnectCount} 次重连，${delay / 1000}秒后...`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  on(type, handler) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = []
    }
    this.messageHandlers[type].push(handler)
  }

  off(type, handler) {
    if (!this.messageHandlers[type]) {
      return
    }
    if (handler) {
      const idx = this.messageHandlers[type].indexOf(handler)
      if (idx > -1) {
        this.messageHandlers[type].splice(idx, 1)
      }
    } else {
      this.messageHandlers[type] = []
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.userId = null
  }
}

export default new WebSocketService()