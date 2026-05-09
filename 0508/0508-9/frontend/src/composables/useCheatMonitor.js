import { ref, onMounted, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const ACTION_TYPES = {
  VISIBILITY_CHANGE: 'VISIBILITY_CHANGE',
  MOUSE_LEAVE: 'MOUSE_LEAVE',
  COPY: 'COPY',
  PASTE: 'PASTE',
  RIGHT_CLICK: 'RIGHT_CLICK',
  KEYBOARD_SHORTCUT: 'KEYBOARD_SHORTCUT'
}

const ACTION_DESCRIPTIONS = {
  [ACTION_TYPES.VISIBILITY_CHANGE]: '切出窗口',
  [ACTION_TYPES.MOUSE_LEAVE]: '鼠标离开考试区域',
  [ACTION_TYPES.COPY]: '复制操作',
  [ACTION_TYPES.PASTE]: '粘贴操作',
  [ACTION_TYPES.RIGHT_CLICK]: '右键菜单',
  [ACTION_TYPES.KEYBOARD_SHORTCUT]: '可疑快捷键'
}

export function useCheatMonitor(options = {}) {
  const {
    examId,
    userId,
    onCheatDetected,
    onConnectionError
  } = options

  const stompClient = ref(null)
  const isConnected = ref(false)
  const isJoining = ref(false)
  const cheatLogs = ref([])
  const warningCount = ref(0)
  const showWarning = ref(false)
  const lastWarning = ref('')
  const connectionError = ref(null)

  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  function connectWebSocket() {
    if (isConnected.value || isJoining.value) {
      return
    }

    const wsUrl = `${window.location.protocol}//${window.location.host}/ws/cheat`
    
    stompClient.value = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[STOMP]', str)
      },
      onConnect: () => {
        console.log('[STOMP] Connected')
        isConnected.value = true
        reconnectAttempts = 0
        connectionError.value = null
        joinExam()
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame)
        connectionError.value = 'STOMP协议错误'
      },
      onWebSocketError: (error) => {
        console.error('[STOMP] WebSocket error:', error)
        isConnected.value = false
      },
      onWebSocketClose: () => {
        console.log('[STOMP] WebSocket closed')
        isConnected.value = false
        isJoining.value = false
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(`[STOMP] Reconnecting... attempt ${reconnectAttempts}/${maxReconnectAttempts}`)
        }
      }
    })

    stompClient.value.activate()
  }

  function joinExam() {
    if (!stompClient.value || !stompClient.value.connected || isJoining.value) {
      return
    }

    isJoining.value = true
    connectionError.value = null

    stompClient.value.publish({
      destination: '/app/student.join',
      body: JSON.stringify({
        examId: Number(examId),
        userId: userId
      })
    })

    setTimeout(() => {
      if (isJoining.value && !connectionError.value) {
        console.log('[STOMP] Join request sent, waiting for response...')
      }
    }, 1000)
  }

  function sendCheatLog(actionType, actionDetail = null, questionId = null) {
    if (!stompClient.value || !stompClient.value.connected) {
      console.warn('[STOMP] Not connected, cannot send cheat log')
      return
    }

    const log = {
      userId: userId,
      examId: Number(examId),
      questionId: questionId,
      actionType: actionType,
      actionDetail: actionDetail,
      timestamp: new Date().toISOString()
    }

    stompClient.value.publish({
      destination: `/app/cheat.report/${examId}`,
      body: JSON.stringify(log)
    })

    console.log('[STOMP] Cheat log sent:', log)
  }

  function reportCheat(actionType, actionDetail = null, questionId = null) {
    const log = {
      userId,
      examId,
      questionId,
      actionType,
      actionDetail,
      timestamp: new Date().toISOString()
    }

    cheatLogs.value.push(log)
    warningCount.value++

    sendCheatLog(actionType, actionDetail, questionId)

    if (onCheatDetected) {
      onCheatDetected(log)
    }

    lastWarning.value = ACTION_DESCRIPTIONS[actionType] || actionType
    showWarning.value = true

    setTimeout(() => {
      showWarning.value = false
    }, 3000)

    console.warn('[Cheat Monitor] Detected:', ACTION_DESCRIPTIONS[actionType], log)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      reportCheat(ACTION_TYPES.VISIBILITY_CHANGE, '用户切换到其他窗口或标签页')
    }
  }

  const handleMouseLeave = (e) => {
    if (e.clientY <= 0 || e.clientX <= 0 || 
        e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      reportCheat(ACTION_TYPES.MOUSE_LEAVE, `鼠标离开窗口边界: X=${e.clientX}, Y=${e.clientY}`)
    }
  }

  const handleCopy = (e) => {
    const selectedText = window.getSelection().toString()
    reportCheat(ACTION_TYPES.COPY, selectedText ? `复制内容: ${selectedText.substring(0, 50)}...` : '复制操作')
  }

  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text') || ''
    reportCheat(ACTION_TYPES.PASTE, pastedText ? `粘贴内容: ${pastedText.substring(0, 50)}...` : '粘贴操作')
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    reportCheat(ACTION_TYPES.RIGHT_CLICK, '右键菜单被禁用')
  }

  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    if (ctrlKey) {
      const suspiciousKeys = ['c', 'v', 'x', 's', 'p', 'a']
      if (suspiciousKeys.includes(e.key.toLowerCase())) {
        e.preventDefault()
        reportCheat(
          ACTION_TYPES.KEYBOARD_SHORTCUT, 
          `快捷键: Ctrl+${e.key.toUpperCase()} 被禁用`
        )
      }
    }

    if (e.key === 'F12') {
      e.preventDefault()
      reportCheat(ACTION_TYPES.KEYBOARD_SHORTCUT, 'F12开发者工具被禁用')
    }

    if (ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault()
      reportCheat(ACTION_TYPES.KEYBOARD_SHORTCUT, 'Ctrl+Shift+I开发者工具被禁用')
    }

    if (e.key === 'PrintScreen') {
      reportCheat(ACTION_TYPES.KEYBOARD_SHORTCUT, 'PrintScreen截图')
    }
  }

  const handleSelectStart = (e) => {
    e.preventDefault()
    return false
  }

  function startMonitoring() {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)

    connectWebSocket()

    console.log('[Cheat Monitor] Monitoring started')
  }

  function stopMonitoring() {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('mouseleave', handleMouseLeave)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('selectstart', handleSelectStart)

    if (stompClient.value) {
      stompClient.value.deactivate()
      stompClient.value = null
    }

    isConnected.value = false
    isJoining.value = false

    console.log('[Cheat Monitor] Monitoring stopped')
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    isConnected,
    isJoining,
    connectionError,
    cheatLogs,
    warningCount,
    showWarning,
    lastWarning,
    reportCheat,
    startMonitoring,
    stopMonitoring,
    ACTION_TYPES,
    ACTION_DESCRIPTIONS
  }
}
