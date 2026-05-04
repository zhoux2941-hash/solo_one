<template>
  <div class="debug-console-container">
    <div class="console-header">
      <div class="header-title">
        <span class="title-icon">🖥️</span>
        <span class="title-text">Debug Console</span>
        <span class="connection-status" :class="connectionStatus">
          {{ connectionStatus === 'connected' ? '● Connected' : '○ Disconnected' }}
        </span>
      </div>
      
      <div class="header-actions">
        <button @click="clearConsole" class="action-btn" title="Clear Console">
          🗑️
        </button>
      </div>
    </div>
    
    <div class="connection-panel" v-if="connectionStatus !== 'connected'">
      <div class="connection-form">
        <input 
          v-model="serverHost" 
          type="text" 
          placeholder="Host (e.g., localhost)"
          class="host-input"
        />
        <input 
          v-model="serverPort" 
          type="number" 
          placeholder="Port"
          class="port-input"
          min="1"
          max="65535"
        />
        <button @click="connectToServer" class="connect-btn" :disabled="isConnecting">
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
      </div>
    </div>
    
    <div class="connection-panel connected-panel" v-else>
      <div class="connected-info">
        <span class="connected-text">Connected to: {{ serverHost }}:{{ serverPort }}</span>
      </div>
      <div class="connected-actions">
        <input 
          v-model="sendMessage" 
          type="text" 
          placeholder="Send message to server..."
          class="message-input"
          @keyup.enter="sendToServer"
        />
        <button @click="sendToServer" class="send-btn" :disabled="!sendMessage.trim()">
          Send
        </button>
        <button @click="disconnectFromServer" class="disconnect-btn">
          Disconnect
        </button>
      </div>
    </div>
    
    <div class="console-content" ref="consoleContent">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        class="log-entry"
        :class="`log-${log.level}`"
      >
        <span class="log-timestamp">[{{ log.timestamp }}]</span>
        <span class="log-level" :class="`level-${log.level}`">
          [{{ log.level.toUpperCase() }}]
        </span>
        <span class="log-message">{{ log.message }}</span>
      </div>
      
      <div class="log-empty" v-if="logs.length === 0">
        <p>No logs yet. Connect to a debug server to see output.</p>
      </div>
    </div>
    
    <div class="console-footer" v-if="logs.length > 0">
      <div class="footer-info">
        <span>{{ logs.length }} entries</span>
        <label class="auto-scroll-label">
          <input type="checkbox" v-model="autoScroll" /> Auto-scroll
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

const logs = ref([])
const connectionStatus = ref('disconnected')
const serverHost = ref('localhost')
const serverPort = ref(8080)
const sendMessage = ref('')
const isConnecting = ref(false)
const autoScroll = ref(true)
const consoleContent = ref(null)

const addLog = (message, level = 'info') => {
  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
  
  logs.value.push({
    message,
    level,
    timestamp
  })
  
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000)
  }
  
  nextTick(() => {
    if (autoScroll.value && consoleContent.value) {
      consoleContent.value.scrollTop = consoleContent.value.scrollHeight
    }
  })
}

const clearConsole = () => {
  logs.value = []
}

const connectToServer = async () => {
  if (!serverHost.value || !serverPort.value) return
  
  isConnecting.value = true
  connectionStatus.value = 'connecting'
  
  try {
    await invoke('connect_to_debug_server', { 
      host: serverHost.value, 
      port: serverPort.value 
    })
    connectionStatus.value = 'connected'
    addLog(`Successfully connected to ${serverHost.value}:${serverPort.value}`, 'info')
  } catch (error) {
    connectionStatus.value = 'disconnected'
    addLog(`Failed to connect: ${error}`, 'error')
  } finally {
    isConnecting.value = false
  }
}

const disconnectFromServer = async () => {
  try {
    await invoke('disconnect_from_debug_server')
    connectionStatus.value = 'disconnected'
    addLog('Disconnected from server', 'info')
  } catch (error) {
    addLog(`Failed to disconnect: ${error}`, 'error')
  }
}

const sendToServer = async () => {
  if (!sendMessage.value.trim() || connectionStatus.value !== 'connected') return
  
  const messageToSend = sendMessage.value.trim()
  addLog(`> ${messageToSend}`, 'debug')
  
  try {
    await invoke('send_to_debug_server', { message: messageToSend })
  } catch (error) {
    addLog(`Failed to send message: ${error}`, 'error')
  }
  
  sendMessage.value = ''
}

onMounted(async () => {
  await listen('debug-log', (event) => {
    const log = event.payload
    addLog(log.message, log.level)
  })
  
  addLog('Debug Console ready. Enter server address and connect.', 'info')
})
</script>

<style scoped>
.debug-console-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  overflow: hidden;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 14px;
}

.title-text {
  font-size: 12px;
  color: #cccccc;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.connection-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.connection-status.connected {
  color: #4ec9b0;
  background-color: rgba(78, 201, 176, 0.1);
}

.connection-status.disconnected {
  color: #f48771;
  background-color: rgba(244, 135, 113, 0.1);
}

.connection-status.connecting {
  color: #dcdcaa;
  background-color: rgba(220, 220, 170, 0.1);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0.7;
}

.action-btn:hover {
  opacity: 1;
  background-color: #3e3e42;
}

.connection-panel {
  padding: 12px;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
}

.connected-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.host-input,
.port-input,
.message-input {
  padding: 6px 10px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
}

.host-input {
  flex: 2;
  min-width: 120px;
}

.port-input {
  width: 80px;
}

.message-input {
  flex: 1;
}

.host-input:focus,
.port-input:focus,
.message-input:focus {
  outline: none;
  border-color: #007acc;
}

.connect-btn,
.send-btn,
.disconnect-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.connect-btn {
  background-color: #0e639c;
  color: white;
}

.connect-btn:hover:not(:disabled) {
  background-color: #1177bb;
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background-color: #4ec9b0;
  color: #1e1e1e;
}

.send-btn:hover:not(:disabled) {
  background-color: #5ddfc3;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.disconnect-btn {
  background-color: #f48771;
  color: #1e1e1e;
}

.disconnect-btn:hover {
  background-color: #ff9b85;
}

.connected-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connected-text {
  font-size: 12px;
  color: #858585;
}

.connected-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  background-color: #1e1e1e;
}

.log-entry {
  display: flex;
  gap: 6px;
  padding: 2px 0;
  line-height: 1.5;
}

.log-timestamp {
  color: #6e6e6e;
  flex-shrink: 0;
}

.log-level {
  font-weight: 600;
  flex-shrink: 0;
  min-width: 60px;
}

.level-info {
  color: #4fc1ff;
}

.level-warning {
  color: #dcdcaa;
}

.level-error {
  color: #f48771;
}

.level-debug {
  color: #c586c0;
}

.log-message {
  color: #d4d4d4;
  word-break: break-all;
}

.log-info .log-message {
  color: #4fc1ff;
}

.log-warning .log-message {
  color: #dcdcaa;
}

.log-error .log-message {
  color: #f48771;
}

.log-debug .log-message {
  color: #c586c0;
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6e6e6e;
  font-size: 13px;
}

.console-footer {
  padding: 6px 12px;
  background-color: #252526;
  border-top: 1px solid #3e3e42;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #858585;
}

.auto-scroll-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.auto-scroll-label input[type="checkbox"] {
  cursor: pointer;
}
</style>
