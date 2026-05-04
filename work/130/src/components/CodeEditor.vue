<template>
  <div class="code-editor-container">
    <div class="editor-header" v-if="currentFile">
      <div class="file-tab active">
        <span class="tab-icon">{{ getFileIcon(currentFile) }}</span>
        <span class="tab-name">{{ currentFile.name }}</span>
        <span class="tab-modified" v-if="isModified">●</span>
        <span class="tab-loading" v-if="isLoading">⟳</span>
      </div>
      <div class="editor-actions">
        <button @click="saveFile" class="action-btn" :disabled="!isModified || isLoading" title="Save (Ctrl+S)">
          💾
        </button>
        <button @click="formatCode" class="action-btn" :disabled="isLoading" title="Format">
          🎨
        </button>
        <button @click="saveSelectedAsSnippet" class="action-btn" :disabled="isLoading || !hasSelection" title="Save Selection as Snippet">
          📋 Save Snippet
        </button>
      </div>
    </div>
    
    <div class="large-file-warning" v-if="showLargeFileWarning">
      <div class="warning-content">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <p class="warning-title">Large File Detected</p>
          <p class="warning-desc">
            File: {{ pendingFile?.name }}<br />
            Size: {{ formatFileSize(pendingFileInfo?.size || 0) }}
          </p>
          <p class="warning-hint" v-if="pendingFileInfo?.is_too_large">
            This file exceeds 100MB and cannot be opened.
          </p>
          <p class="warning-hint" v-else>
            Opening large files may affect performance. Would you like to open a truncated version (first 10MB)?
          </p>
        </div>
        <div class="warning-actions">
          <button 
            v-if="!pendingFileInfo?.is_too_large"
            @click="confirmLoadLargeFile" 
            class="btn-primary"
          >
            Open Truncated
          </button>
          <button @click="cancelLoadLargeFile" class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <div class="editor-placeholder" v-else-if="!currentFile && !isLoading">
      <div class="placeholder-content">
        <div class="placeholder-icon">📝</div>
        <div class="placeholder-text">
          <p>Welcome to Code Editor</p>
          <p class="hint">Open a folder from the left panel to get started</p>
        </div>
      </div>
    </div>
    
    <div class="editor-loading" v-else-if="isLoading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading file...</p>
        <p class="loading-hint">{{ currentFile?.name || 'Please wait' }}</p>
      </div>
    </div>
    
    <div class="editor-wrapper" ref="editorContainer" v-if="currentFile && !isLoading && !showLargeFileWarning"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as monaco from 'monaco-editor'
import { invoke } from '@tauri-apps/api/tauri'
import { listen, emit } from '@tauri-apps/api/event'

const editorContainer = ref(null)
const currentFile = ref(null)
const editor = ref(null)
const isModified = ref(false)
const originalContent = ref('')
const isLoading = ref(false)
const showLargeFileWarning = ref(false)
const pendingFile = ref(null)
const pendingFileInfo = ref(null)
const currentSelection = ref('')

const hasSelection = computed(() => {
  return currentSelection.value.length > 0
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (file) => {
  if (!file) return '📄'
  
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'js': '🟨',
    'jsx': '⚛️',
    'ts': '🔷',
    'tsx': '⚛️',
    'vue': '🟢',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'json': '📋',
    'md': '📝',
    'py': '🐍',
    'rs': '🦀',
    'go': '🐹',
    'java': '☕',
    'c': '⚙️',
    'cpp': '⚙️',
    'txt': '📄',
    'log': '📊',
  }
  
  return iconMap[ext] || '📄'
}

const getLanguage = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const langMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'vue': 'vue',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'txt': 'plaintext',
    'log': 'plaintext',
  }
  
  return langMap[ext] || 'plaintext'
}

const initEditor = () => {
  if (!editorContainer.value) return
  
  editor.value = monaco.editor.create(editorContainer.value, {
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    minimap: {
      enabled: true,
      scale: 0.5,
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    padding: {
      top: 10,
    },
  })
  
  editor.value.onDidChangeModelContent(() => {
    if (editor.value && currentFile.value) {
      const currentContent = editor.value.getValue()
      isModified.value = currentContent !== originalContent.value
    }
  })
  
  editor.value.onDidChangeCursorSelection(() => {
    if (editor.value) {
      const selection = editor.value.getSelection()
      if (selection && !selection.isEmpty()) {
        const model = editor.value.getModel()
        if (model) {
          currentSelection.value = model.getValueInRange(selection)
        }
      } else {
        currentSelection.value = ''
      }
    }
  })
  
  editor.value.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
    saveFile
  )
}

const loadFileToEditor = (file, content, isTruncated) => {
  currentFile.value = file
  originalContent.value = content
  isModified.value = false
  
  if (editor.value) {
    const model = monaco.editor.createModel(
      content,
      getLanguage(file.name),
      monaco.Uri.file(file.path)
    )
    editor.value.setModel(model)
    editor.value.updateOptions({
      language: getLanguage(file.name),
    })
  }
  
  isLoading.value = false
}

const loadFile = async (file) => {
  if (!file || file.is_directory) return
  
  showLargeFileWarning.value = false
  pendingFile.value = null
  pendingFileInfo.value = null
  
  try {
    const fileInfo = await invoke('get_file_info', { filePath: file.path })
    
    if (fileInfo.is_large || fileInfo.is_too_large) {
      pendingFile.value = file
      pendingFileInfo.value = fileInfo
      showLargeFileWarning.value = true
      return
    }
    
    isLoading.value = true
    currentFile.value = file
    
    const result = await invoke('read_file', { 
      filePath: file.path,
      truncateLarge: false
    })
    
    if (result.content) {
      loadFileToEditor(file, result.content, result.is_truncated)
    } else {
      isLoading.value = false
    }
  } catch (error) {
    console.error('Failed to load file:', error)
    isLoading.value = false
    alert('Failed to load file: ' + error)
  }
}

const confirmLoadLargeFile = async () => {
  if (!pendingFile.value || !pendingFileInfo.value) return
  
  showLargeFileWarning.value = false
  isLoading.value = true
  currentFile.value = pendingFile.value
  
  try {
    const result = await invoke('read_file', { 
      filePath: pendingFile.value.path,
      truncateLarge: true
    })
    
    if (result.content) {
      loadFileToEditor(pendingFile.value, result.content, result.is_truncated)
    } else {
      isLoading.value = false
      alert('Failed to load truncated file content')
    }
  } catch (error) {
    console.error('Failed to load large file:', error)
    isLoading.value = false
    alert('Failed to load file: ' + error)
  } finally {
    pendingFile.value = null
    pendingFileInfo.value = null
  }
}

const cancelLoadLargeFile = () => {
  showLargeFileWarning.value = false
  pendingFile.value = null
  pendingFileInfo.value = null
  currentFile.value = null
  isLoading.value = false
}

const saveFile = async () => {
  if (!editor.value || !currentFile.value || isLoading.value) return
  
  const content = editor.value.getValue()
  
  try {
    await invoke('write_file', { 
      filePath: currentFile.value.path, 
      content: content 
    })
    originalContent.value = content
    isModified.value = false
    console.log('File saved successfully')
  } catch (error) {
    console.error('Failed to save file:', error)
    alert('Failed to save file: ' + error)
  }
}

const formatCode = () => {
  if (editor.value && !isLoading.value) {
    editor.value.getAction('editor.action.formatDocument').run()
  }
}

const saveSelectedAsSnippet = () => {
  if (!currentSelection.value) return
  
  const language = currentFile.value 
    ? getLanguage(currentFile.value.name) 
    : 'plaintext'
  
  emit('save-selected-code', {
    content: currentSelection.value,
    language: language
  })
}

const insertSnippet = (content) => {
  if (!editor.value) return
  
  const selection = editor.value.getSelection()
  if (selection) {
    editor.value.executeEdits('insert-snippet', [
      {
        range: selection,
        text: content,
        forceMoveMarkers: true
      }
    ])
  } else {
    const position = editor.value.getPosition()
    if (position) {
      editor.value.executeEdits('insert-snippet', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          text: content,
          forceMoveMarkers: true
        }
      ])
    }
  }
}

const handleFileSelected = async (event) => {
  const file = event.payload
  await loadFile(file)
}

const handleInsertSnippet = async (event) => {
  const snippet = event.payload
  if (snippet && snippet.content) {
    insertSnippet(snippet.content)
  }
}

onMounted(async () => {
  initEditor()
  
  await listen('file-selected', handleFileSelected)
  await listen('insert-snippet', handleInsertSnippet)
  
  await listen('file-change', async (event) => {
    const change = event.payload
    if (currentFile.value && change.path === currentFile.value.path) {
      if (change.event_type === 'modify') {
        const currentContent = editor.value?.getValue() || ''
        if (currentContent === originalContent.value && !isLoading.value) {
          await loadFile(currentFile.value)
        }
      } else if (change.event_type === 'remove') {
        currentFile.value = null
        originalContent.value = ''
        isModified.value = false
        if (editor.value) {
          editor.value.setValue('')
        }
      }
    }
  })
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.dispose()
  }
})

watch(currentFile, () => {
  nextTick(() => {
    if (editor.value) {
      editor.value.layout()
    }
  })
})
</script>

<style scoped>
.code-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  overflow: hidden;
  position: relative;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #252526;
  border-bottom: 1px solid #1e1e1e;
  height: 35px;
  padding: 0 8px;
  flex-shrink: 0;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background-color: #1e1e1e;
  border-top: 2px solid #007acc;
  cursor: pointer;
  height: 100%;
}

.tab-icon {
  font-size: 14px;
}

.tab-name {
  font-size: 13px;
  color: #cccccc;
}

.tab-modified {
  font-size: 10px;
  color: #4ec9b0;
  margin-left: 2px;
}

.tab-loading {
  font-size: 12px;
  color: #4fc1ff;
  margin-left: 4px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.editor-actions {
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
  transition: opacity 0.2s;
}

.action-btn:hover:not(:disabled) {
  opacity: 1;
  background-color: #3e3e42;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

.editor-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6e6e6e;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder-text p {
  margin: 8px 0;
}

.placeholder-text .hint {
  font-size: 13px;
  color: #4e4e4e;
}

.editor-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6e6e6e;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #3e3e42;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-content p {
  margin: 4px 0;
}

.loading-hint {
  font-size: 12px;
  color: #4e4e4e;
}

.large-file-warning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(30, 30, 30, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.warning-content {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.warning-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.warning-text {
  text-align: center;
  margin-bottom: 20px;
}

.warning-title {
  font-size: 18px;
  font-weight: 600;
  color: #dcdcaa;
  margin: 0 0 12px 0;
}

.warning-desc {
  font-size: 14px;
  color: #cccccc;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.warning-hint {
  font-size: 13px;
  color: #858585;
  margin: 0;
  line-height: 1.5;
}

.warning-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-primary {
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1177bb;
}

.btn-secondary {
  background-color: #3c3c3c;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #4c4c4c;
}
</style>
