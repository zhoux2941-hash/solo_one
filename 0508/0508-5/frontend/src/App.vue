<template>
  <div class="container">
    <h1>物联网灯光控制平台</h1>
    
    <div class="status-section">
      <div class="connection-status" :class="connected ? 'connected' : 'disconnected'">
        <span class="status-dot"></span>
        MQTT连接状态: {{ connected ? '已连接' : '未连接' }}
      </div>
    </div>

    <div class="light-control">
      <div class="light-bulb" :class="{ 'on': lightStatus === 'ON' }">
        <div class="bulb-glow"></div>
      </div>
      <div class="light-status">
        <span>当前灯状态: </span>
        <span class="status-text" :class="lightStatus === 'ON' ? 'on-text' : 'off-text'">
          {{ lightStatus === 'ON' ? '开启' : '关闭' }}
        </span>
      </div>
    </div>

    <div class="button-group">
      <button class="btn btn-on" @click="turnOn" :disabled="!connected || isProcessing">
        <span v-if="isProcessing && pendingAction === 'ON'">处理中...</span>
        <span v-else>开灯</span>
      </button>
      <button class="btn btn-off" @click="turnOff" :disabled="!connected || isProcessing">
        <span v-if="isProcessing && pendingAction === 'OFF'">处理中...</span>
        <span v-else>关灯</span>
      </button>
    </div>

    <div class="log-section">
      <div class="log-header">
        <h2>操作日志</h2>
        <button class="btn-clear" @click="clearLogs" v-if="logs.length > 0">
          清空日志
        </button>
      </div>
      <div class="log-container" ref="logContainer">
        <template v-for="(log, index) in logs" :key="index">
          <div class="log-entry" :class="log.type">
            <div class="log-icon">
              <span v-if="log.type === 'action'">🖱️</span>
              <span v-else-if="log.type === 'request'">📤</span>
              <span v-else-if="log.type === 'response'">📥</span>
              <span v-else-if="log.type === 'success'">✅</span>
              <span v-else-if="log.type === 'error'">❌</span>
              <span v-else-if="log.type === 'warning'">⚠️</span>
              <span v-else-if="log.type === 'complete'">🔔</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="log-content">
              <div class="log-main">
                <span class="log-message">{{ log.message }}</span>
                <span class="log-duration" v-if="log.duration">
                  耗时: {{ log.duration }}ms
                </span>
              </div>
              <div class="log-details">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-detail-info" v-if="log.detail">
                  {{ log.detail }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <div v-if="logs.length === 0" class="log-empty">
          暂无日志记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import mqtt from 'mqtt'

const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt'
const TOPIC_CONTROL = 'iot/light/control'
const TOPIC_STATUS = 'iot/light/status'
const CLIENT_ID = 'frontend_' + Math.random().toString(16).substring(2, 8)

const connected = ref(false)
const lightStatus = ref('OFF')
const logs = ref([])
const logContainer = ref(null)
const isProcessing = ref(false)
const pendingAction = ref(null)
const COMMAND_TIMEOUT = 5000
let client = null
let timeoutTimer = null
let commandStartTime = null

const formatTime = (date) => {
  const pad = (n) => n.toString().padStart(2, '0')
  const ms = date.getMilliseconds().toString().padStart(3, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`
}

const addLog = (options) => {
  const { message, type = 'info', detail = '', duration = null } = options
  const now = new Date()
  const log = {
    id: Date.now(),
    time: formatTime(now),
    message,
    type,
    detail,
    duration
  }
  logs.value.push(log)
  
  const logOutput = detail ? `[${type.toUpperCase()}] ${message} - ${detail}` : `[${type.toUpperCase()}] ${message}`
  if (duration !== null) {
    console.log(`${logOutput} (${duration}ms)`)
  } else {
    console.log(logOutput)
  }
  
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const clearLogs = () => {
  logs.value = []
}

const connectMQTT = () => {
  addLog({ message: `正在连接MQTT Broker`, type: 'info', detail: BROKER_URL })
  addLog({ message: `客户端ID`, type: 'info', detail: CLIENT_ID })

  client = mqtt.connect(BROKER_URL, {
    clientId: CLIENT_ID,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  })

  client.on('connect', () => {
    connected.value = true
    addLog({ message: '成功连接到MQTT Broker', type: 'success' })
    
    client.subscribe(TOPIC_STATUS, (err) => {
      if (err) {
        addLog({ message: '订阅主题失败', type: 'error', detail: TOPIC_STATUS })
      } else {
        addLog({ message: '已订阅主题', type: 'success', detail: TOPIC_STATUS })
      }
    })
  })

  client.on('reconnect', () => {
    addLog({ message: '正在重新连接...', type: 'warning' })
  })

  client.on('error', (err) => {
    addLog({ message: '连接错误', type: 'error', detail: err.message })
    connected.value = false
  })

  client.on('close', () => {
    addLog({ message: '连接已关闭', type: 'warning' })
    connected.value = false
  })

  client.on('offline', () => {
    addLog({ message: '客户端离线', type: 'warning' })
    connected.value = false
  })

  client.on('message', (topic, message) => {
    const payload = message.toString()
    const responseTime = Date.now()
    
    addLog({ 
      message: '收到消息', 
      type: 'response', 
      detail: `主题: ${topic}, 内容: ${payload}` 
    })
    
    if (topic === TOPIC_STATUS) {
      lightStatus.value = payload
      addLog({ 
        message: '灯状态更新', 
        type: 'success', 
        detail: `新状态: ${payload === 'ON' ? '开启' : '关闭'}` 
      })
      
      if (isProcessing.value && pendingAction.value === payload) {
        clearTimeout(timeoutTimer)
        const duration = commandStartTime ? responseTime - commandStartTime : null
        isProcessing.value = false
        pendingAction.value = null
        addLog({ 
          message: '命令执行完成', 
          type: 'complete', 
          detail: '按钮已解锁',
          duration
        })
        commandStartTime = null
      }
    }
  })
}

const publishMessage = (topic, message) => {
  if (!connected.value) {
    addLog({ message: '无法发送消息', type: 'error', detail: '未连接到MQTT Broker' })
    return
  }

  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      addLog({ message: '消息发送失败', type: 'error', detail: err.message })
    } else {
      addLog({ 
        message: '已发送消息', 
        type: 'request', 
        detail: `主题: ${topic}, 内容: ${message}` 
      })
    }
  })
}

const executeCommand = (command) => {
  if (isProcessing.value) {
    addLog({ message: '命令执行中，请稍候...', type: 'warning' })
    return
  }
  
  if (lightStatus.value === command) {
    addLog({ 
      message: '无需重复操作', 
      type: 'warning', 
      detail: `灯已经是${command === 'ON' ? '开启' : '关闭'}状态` 
    })
    return
  }
  
  isProcessing.value = true
  pendingAction.value = command
  commandStartTime = Date.now()
  
  const actionName = command === 'ON' ? '开灯' : '关灯'
  
  addLog({ 
    message: `用户点击: ${actionName}`, 
    type: 'action',
    detail: '点击时间已记录'
  })
  
  timeoutTimer = setTimeout(() => {
    if (isProcessing.value) {
      const timeoutDuration = Date.now() - commandStartTime
      isProcessing.value = false
      pendingAction.value = null
      commandStartTime = null
      addLog({ 
        message: '命令执行超时', 
        type: 'error', 
        detail: `等待时间: ${timeoutDuration}ms`,
        duration: timeoutDuration
      })
    }
  }, COMMAND_TIMEOUT)
  
  publishMessage(TOPIC_CONTROL, command)
}

const turnOn = () => {
  executeCommand('ON')
}

const turnOff = () => {
  executeCommand('OFF')
}

onMounted(() => {
  addLog({ message: '前端应用已启动', type: 'info' })
  connectMQTT()
})

onUnmounted(() => {
  if (client) {
    client.end()
    addLog({ message: '断开MQTT连接', type: 'info' })
  }
})
</script>

<style scoped>
.container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

h1 {
  text-align: center;
  color: #ffffff;
  margin-bottom: 30px;
  font-size: 28px;
}

.status-section {
  margin-bottom: 30px;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
}

.connection-status.connected {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.connection-status.disconnected {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
  animation: pulse 2s infinite;
}

.connected .status-dot {
  background: #4caf50;
}

.disconnected .status-dot {
  background: #f44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.light-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.light-bulb {
  width: 150px;
  height: 150px;
  position: relative;
  margin-bottom: 20px;
}

.light-bulb::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='35' fill='%23555'/%3E%3Crect x='35' y='70' width='30' height='20' rx='3' fill='%23666'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  transition: all 0.3s ease;
}

.light-bulb.on::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='35' fill='%23ffeb3b'/%3E%3Crect x='35' y='70' width='30' height='20' rx='3' fill='%23888'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.bulb-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0;
  background: radial-gradient(circle, rgba(255, 235, 59, 0.6) 0%, transparent 70%);
  transition: all 0.3s ease;
}

.light-bulb.on .bulb-glow {
  opacity: 1;
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 30px 10px rgba(255, 235, 59, 0.3);
  }
  to {
    box-shadow: 0 0 60px 20px rgba(255, 235, 59, 0.5);
  }
}

.light-status {
  font-size: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-text {
  font-weight: bold;
  font-size: 24px;
}

.on-text {
  color: #ffeb3b;
}

.off-text {
  color: #9e9e9e;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.btn {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-on {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.btn-on:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
}

.btn-off {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
}

.btn-off:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.6);
}

.log-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.log-header h2 {
  color: #ffffff;
  font-size: 18px;
  margin: 0;
}

.btn-clear {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.4);
  color: #e57373;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.log-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 30px;
  font-style: italic;
}

.log-entry {
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-left: 3px solid transparent;
}

.log-entry.info {
  background: rgba(33, 150, 243, 0.1);
  color: #64b5f6;
  border-left-color: #2196f3;
}

.log-entry.success {
  background: rgba(76, 175, 80, 0.1);
  color: #81c784;
  border-left-color: #4caf50;
}

.log-entry.error {
  background: rgba(244, 67, 54, 0.1);
  color: #e57373;
  border-left-color: #f44336;
}

.log-entry.warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ffb74d;
  border-left-color: #ff9800;
}

.log-entry.action {
  background: rgba(156, 39, 176, 0.1);
  color: #ce93d8;
  border-left-color: #9c27b0;
}

.log-entry.request {
  background: rgba(33, 150, 243, 0.08);
  color: #4fc3f7;
  border-left-color: #03a9f4;
}

.log-entry.response {
  background: rgba(76, 175, 80, 0.08);
  color: #66bb6a;
  border-left-color: #8bc34a;
}

.log-entry.complete {
  background: rgba(255, 193, 7, 0.1);
  color: #ffd54f;
  border-left-color: #ffc107;
}

.log-icon {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.log-message {
  font-weight: 600;
  word-break: break-word;
}

.log-duration {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.8);
}

.log-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
}

.log-time {
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.log-detail-info {
  color: rgba(255, 255, 255, 0.5);
  word-break: break-all;
}
</style>
