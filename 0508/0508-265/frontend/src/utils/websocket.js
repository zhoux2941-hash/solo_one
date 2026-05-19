import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import { useAlertStore } from '../store'
import { ElMessage } from 'element-plus'

let stompClient = null
let reconnectAttempts = 0
const maxReconnectAttempts = 5

export function connectWebSocket() {
  if (stompClient && stompClient.connected) {
    return
  }

  const socket = new SockJS('/ws')
  stompClient = Stomp.over(socket)
  stompClient.debug = () => {}

  stompClient.connect(
    {},
    frame => {
      console.log('WebSocket connected:', frame)
      reconnectAttempts = 0

      stompClient.subscribe('/topic/alerts', message => {
        const alert = JSON.parse(message.body)
        const alertStore = useAlertStore()
        alertStore.addAlert(alert)
        
        let type = 'warning'
        if (alert.level === 'ERROR') type = 'error'
        if (alert.level === 'INFO') type = 'info'
        
        ElMessage({
          type,
          message: `设备告警: ${alert.title}`,
          duration: 5000
        })
      })

      stompClient.subscribe('/topic/notifications', message => {
        const notification = JSON.parse(message.body)
        ElMessage({
          type: 'success',
          message: notification.message,
          duration: 3000
        })
      })
    },
    error => {
      console.error('WebSocket error:', error)
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        setTimeout(() => connectWebSocket(), 3000 * reconnectAttempts)
      }
    }
  )
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.disconnect()
    stompClient = null
  }
}

export default {
  connectWebSocket,
  disconnectWebSocket
}
