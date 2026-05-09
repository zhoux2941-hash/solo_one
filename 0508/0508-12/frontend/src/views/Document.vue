<template>
  <div class="document-container">
    <header class="doc-header">
      <div class="header-left">
        <el-button type="text" @click="goBack" icon="ArrowLeft" class="back-btn">
          返回
        </el-button>
        <div class="doc-info">
          <h1 class="doc-title" contenteditable="true" @blur="updateTitle">
            {{ document?.title || '未命名文档' }}
          </h1>
          <span class="doc-status" :class="saveStatus">
            {{ statusText }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="saveDocument" :loading="saving" icon="Document">
          保存
        </el-button>
        <el-button @click="showDashboard = !showDashboard" icon="DataAnalysis">
          情感分析
        </el-button>
      </div>
    </header>

    <div class="doc-content">
      <div class="editor-section" :class="{ collapsed: showDashboard }">
        <QuillEditor
          ref="editorRef"
          v-model="editorContent"
          @text-change="handleTextChange"
          @text-selected="handleTextSelected"
        />
      </div>

      <div v-if="showDashboard" class="dashboard-section">
        <SentimentDashboard :doc-id="docId" />
      </div>
    </div>

    <ConflictAlert
      v-if="currentAlert"
      :alert="currentAlert"
      @dismiss="dismissAlert"
      @contact="handleContactCollaborator"
    />

    <div v-if="alertQueue.length > 1" class="alert-badge">
      {{ alertQueue.length }} 条预警
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { documentApi } from '@/api'
import websocket from '@/utils/websocket'
import QuillEditor from '@/components/QuillEditor.vue'
import SentimentDashboard from '@/components/SentimentDashboard.vue'
import ConflictAlert from '@/components/ConflictAlert.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const docId = computed(() => route.params.id)
const editorRef = ref(null)
const document = ref(null)
const editorContent = ref('')
const showDashboard = ref(false)
const saveStatus = ref('saved')
const saving = ref(false)
let autoSaveTimer = null
let lastContent = ''

const alertQueue = ref([])
const currentAlert = ref(null)
const processedAlertIds = new Set()

const statusText = computed(() => {
  const map = {
    'saving': '保存中...',
    'saved': '已保存',
    'unsaved': '未保存'
  }
  return map[saveStatus.value]
})

const loadDocument = async () => {
  if (!docId.value) return
  
  try {
    const response = await documentApi.getDocument(docId.value)
    document.value = response.data
    editorContent.value = response.data.currentContent || ''
    lastContent = editorContent.value
  } catch (error) {
    console.error('Failed to load document:', error)
    ElMessage.error('加载文档失败')
  }
}

const updateTitle = async (e) => {
  const newTitle = e.target.innerText.trim()
  if (newTitle && newTitle !== document.value?.title) {
    document.value.title = newTitle
  }
}

const handleTextChange = (data) => {
  saveStatus.value = 'unsaved'
  
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(async () => {
    if (data.content !== lastContent) {
      await autoSave(false)
    }
  }, 2000)
}

const handleTextSelected = (data) => {
  if (userStore.currentUser && docId.value) {
    documentApi.logAction(
      docId.value,
      userStore.currentUser.id,
      'SELECT',
      data.text,
      data.positionStart,
      data.positionEnd
    ).catch(() => {})
  }
}

const autoSave = async (isSave = false) => {
  if (!userStore.currentUser || !docId.value) return
  if (editorContent.value === lastContent && !isSave) return
  
  saveStatus.value = 'saving'
  
  try {
    await documentApi.updateContent(
      docId.value,
      userStore.currentUser.id,
      editorContent.value,
      isSave
    )
    lastContent = editorContent.value
    saveStatus.value = 'saved'
    
    if (isSave) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('Failed to save:', error)
    saveStatus.value = 'unsaved'
    if (isSave) {
      ElMessage.error('保存失败')
    }
  }
}

const saveDocument = () => {
  autoSave(true)
}

const handleRemoteUpdate = (data) => {
  if (data.userId !== userStore.currentUser?.id && data.content) {
    editorContent.value = data.content
    lastContent = data.content
    saveStatus.value = 'saved'
  }
}

const handleConflictAlert = (message) => {
  let alert
  try {
    alert = typeof message === 'string' ? JSON.parse(message) : message
  } catch (e) {
    console.warn('Failed to parse alert message:', e)
    return
  }

  if (!alert.alertId || processedAlertIds.has(alert.alertId)) {
    return
  }

  processedAlertIds.add(alert.alertId)
  alertQueue.value.push(alert)

  if (!currentAlert.value) {
    showNextAlert()
  }

  console.log('Conflict alert received:', alert.message)
}

const showNextAlert = () => {
  if (alertQueue.value.length > 0) {
    currentAlert.value = alertQueue.value.shift()
  } else {
    currentAlert.value = null
  }
}

const dismissAlert = () => {
  showNextAlert()
}

const handleContactCollaborator = (alert) => {
  ElMessage.info(`已向 ${alert.otherUserName || '协作者'} 发送沟通邀请`)
}

const initWebSocket = async () => {
  try {
    await websocket.connect()
    websocket.subscribe(`/topic/documents/${docId.value}`, handleRemoteUpdate)
    websocket.subscribe(`/topic/documents/${docId.value}/alerts`, handleConflictAlert)
  } catch (error) {
    console.warn('WebSocket connection failed, collaboration disabled:', error)
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  if (!userStore.currentUser) {
    userStore.restoreUser()
    if (!userStore.currentUser) {
      router.push('/')
      return
    }
  }
  
  loadDocument()
  initWebSocket()
})

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  websocket.unsubscribe(`/topic/documents/${docId.value}`)
  websocket.unsubscribe(`/topic/documents/${docId.value}/alerts`)
  processedAlertIds.clear()
  alertQueue.value = []
  currentAlert.value = null
})
</script>

<style scoped>
.document-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F3F4F6;
}

.doc-header {
  background: white;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 16px;
}

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  outline: none;
  min-width: 100px;
}

.doc-title:focus {
  background: #F3F4F6;
  border-radius: 4px;
  padding: 2px 8px;
  margin: -2px -8px;
}

.doc-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.doc-status.saved {
  background: #D1FAE5;
  color: #059669;
}

.doc-status.saving {
  background: #FEF3C7;
  color: #D97706;
}

.doc-status.unsaved {
  background: #FEE2E2;
  color: #DC2626;
}

.header-right {
  display: flex;
  gap: 12px;
}

.doc-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-section {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  transition: flex 0.3s ease;
}

.editor-section.collapsed {
  flex: 0.6;
}

.dashboard-section {
  flex: 0.4;
  overflow-y: auto;
  border-left: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.alert-badge {
  position: fixed;
  top: 90px;
  right: 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  z-index: 9998;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
