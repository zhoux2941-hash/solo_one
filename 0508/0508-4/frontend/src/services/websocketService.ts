interface WebSocketCallbacks {
  onOpen?: () => void
  onClose?: () => void
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onReconnect?: (attempt: number) => void
}

interface WebSocketConfig {
  maxReconnectAttempts?: number
  initialReconnectDelay?: number
  maxReconnectDelay?: number
  heartbeatInterval?: number
}

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  maxReconnectAttempts: 50,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000
}

let ws: WebSocket | null = null
let config: Required<WebSocketConfig> = { ...DEFAULT_CONFIG }
let callbacks: WebSocketCallbacks = {}
let subscribedCodes: Set<string> = new Set()

let reconnectTimer: NodeJS.Timeout | null = null
let reconnectAttempt: number = 0
let heartbeatTimer: NodeJS.Timeout | null = null
let isManualClose: boolean = false
let isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

let networkOnlineHandler: (() => void) | null = null
let networkOfflineHandler: (() => void) | null = null

export const initWebSocket = (
  newCallbacks: WebSocketCallbacks = {},
  newConfig: WebSocketConfig = {}
) => {
  callbacks = { ...callbacks, ...newCallbacks }
  config = { ...DEFAULT_CONFIG, ...newConfig }

  setupNetworkListeners()
  isManualClose = false

  connect()
}

const connect = () => {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  try {
    console.log(`[WebSocket] Connecting to ${wsUrl}...`)
    ws = new WebSocket(wsUrl)

    ws.onopen = handleOpen
    ws.onclose = handleClose
    ws.onerror = handleError
    ws.onmessage = handleMessage
  } catch (error) {
    console.error('[WebSocket] Failed to create WebSocket:', error)
    handleError(error as any)
  }
}

const handleOpen = () => {
  console.log('[WebSocket] Connected')
  reconnectAttempt = 0
  
  stopHeartbeat()
  startHeartbeat()

  if (subscribedCodes.size > 0) {
    console.log(`[WebSocket] Resubscribing to ${subscribedCodes.size} stocks...`)
    sendSubscribeMessage(Array.from(subscribedCodes))
  }

  callbacks.onOpen?.()
}

const handleClose = (event: CloseEvent) => {
  console.log(`[WebSocket] Disconnected (code: ${event.code}, reason: ${event.reason})`)
  
  stopHeartbeat()

  callbacks.onClose?.()

  if (!isManualClose) {
    scheduleReconnect()
  }
}

const handleError = (error: Event) => {
  console.error('[WebSocket] Error:', error)
  callbacks.onError?.(error)
}

const handleMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data)
    callbacks.onMessage?.(data)
  } catch (error) {
    console.error('[WebSocket] Failed to parse message:', error)
  }
}

const scheduleReconnect = () => {
  if (isManualClose) return
  if (reconnectAttempt >= config.maxReconnectAttempts) {
    console.error('[WebSocket] Max reconnect attempts reached')
    return
  }

  const delay = calculateReconnectDelay()
  reconnectAttempt++

  console.log(`[WebSocket] Scheduling reconnect attempt ${reconnectAttempt}/${config.maxReconnectAttempts} in ${delay}ms...`)
  
  callbacks.onReconnect?.(reconnectAttempt)

  reconnectTimer = setTimeout(() => {
    if (!isOnline) {
      console.log('[WebSocket] Network is offline, waiting for online event...')
      scheduleReconnect()
      return
    }
    connect()
  }, delay)
}

const calculateReconnectDelay = (): number => {
  const delay = config.initialReconnectDelay * Math.pow(1.5, reconnectAttempt)
  const jitter = delay * (0.5 + Math.random() * 0.5)
  return Math.min(jitter, config.maxReconnectDelay)
}

const startHeartbeat = () => {
  if (heartbeatTimer) return

  heartbeatTimer = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ping',
        payload: { timestamp: Date.now() }
      }))
    }
  }, config.heartbeatInterval)
}

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const setupNetworkListeners = () => {
  if (networkOnlineHandler || networkOfflineHandler) return

  networkOnlineHandler = () => {
    isOnline = true
    console.log('[Network] Online, attempting to reconnect WebSocket...')
    
    if (ws?.readyState !== WebSocket.OPEN) {
      reconnectAttempt = 0
      connect()
    }
  }

  networkOfflineHandler = () => {
    isOnline = false
    console.log('[Network] Offline')
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  window.addEventListener('online', networkOnlineHandler)
  window.addEventListener('offline', networkOfflineHandler)
}

const removeNetworkListeners = () => {
  if (networkOnlineHandler) {
    window.removeEventListener('online', networkOnlineHandler)
    networkOnlineHandler = null
  }
  if (networkOfflineHandler) {
    window.removeEventListener('offline', networkOfflineHandler)
    networkOfflineHandler = null
  }
}

const sendSubscribeMessage = (codes: string[]) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      payload: { codes }
    }))
  }
}

const sendUnsubscribeMessage = (codes: string[]) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'unsubscribe',
      payload: { codes }
    }))
  }
}

export const disconnectWebSocket = () => {
  isManualClose = true
  stopHeartbeat()
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (ws) {
    ws.close()
    ws = null
  }

  removeNetworkListeners()
}

export const subscribeStock = (codes: string[]) => {
  const newCodes = codes.filter(code => !subscribedCodes.has(code))
  
  if (newCodes.length === 0) return

  newCodes.forEach(code => subscribedCodes.add(code))
  
  if (ws?.readyState === WebSocket.OPEN) {
    sendSubscribeMessage(newCodes)
  }
}

export const unsubscribeStock = (codes: string[]) => {
  codes.forEach(code => subscribedCodes.delete(code))
  sendUnsubscribeMessage(codes)
}

export const updateSubscriptions = (codes: string[]) => {
  const newSet = new Set(codes)
  
  const toAdd = codes.filter(code => !subscribedCodes.has(code))
  const toRemove = Array.from(subscribedCodes).filter(code => !newSet.has(code))

  if (toRemove.length > 0) {
    toRemove.forEach(code => subscribedCodes.delete(code))
    if (ws?.readyState === WebSocket.OPEN) {
      sendUnsubscribeMessage(toRemove)
    }
  }

  if (toAdd.length > 0) {
    toAdd.forEach(code => subscribedCodes.add(code))
    if (ws?.readyState === WebSocket.OPEN) {
      sendSubscribeMessage(toAdd)
    }
  }
}

export const clearSubscriptions = () => {
  if (subscribedCodes.size > 0) {
    sendUnsubscribeMessage(Array.from(subscribedCodes))
    subscribedCodes.clear()
  }
}

export const getWebSocketStatus = (): {
  readyState: number
  isConnected: boolean
  isOnline: boolean
  reconnectAttempt: number
  subscribedCount: number
} => ({
  readyState: ws?.readyState ?? WebSocket.CLOSED,
  isConnected: ws?.readyState === WebSocket.OPEN,
  isOnline,
  reconnectAttempt,
  subscribedCount: subscribedCodes.size
})

export const sendHeartbeat = () => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      payload: { timestamp: Date.now() }
    }))
  }
}
