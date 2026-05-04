<template>
  <div class="file-tree-container">
    <div class="toolbar">
      <button @click="openFolder" class="toolbar-btn" title="Open Folder">
        📁
      </button>
      <button @click="refreshFiles" class="toolbar-btn" title="Refresh">
        🔄
      </button>
      <button @click="createNewFile" class="toolbar-btn" title="New File">
        📄
      </button>
      <button @click="createNewFolder" class="toolbar-btn" title="New Folder">
        📁+
      </button>
    </div>
    
    <div class="current-path" v-if="currentPath">
      {{ currentPath }}
    </div>
    
    <div class="file-list" v-if="files.length > 0">
      <div 
        v-for="file in files" 
        :key="file.path"
        class="file-item"
        :class="{ 
          'is-directory': file.is_directory,
          'is-selected': selectedFile === file.path
        }"
        @click="handleFileClick(file)"
      >
        <span class="file-icon">
          {{ getFileIcon(file) }}
        </span>
        <span class="file-name">{{ file.name }}</span>
        
        <div class="file-actions" v-if="selectedFile === file.path">
          <button 
            @click.stop="renameFile(file)" 
            class="action-btn" 
            title="Rename"
          >
            ✏️
          </button>
          <button 
            @click.stop="deleteItem(file)" 
            class="action-btn" 
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <p>No folder selected</p>
      <button @click="openFolder" class="open-folder-btn">
        Open Folder
      </button>
    </div>
    
    <div v-if="showNewFileModal" class="modal-overlay">
      <div class="modal">
        <h3>Create New {{ isFolder ? 'Folder' : 'File' }}</h3>
        <input 
          v-model="newItemName" 
          type="text" 
          placeholder="Enter name..."
          @keyup.enter="confirmCreate"
          @keyup.esc="cancelCreate"
          ref="newItemInput"
        />
        <div class="modal-buttons">
          <button @click="confirmCreate" class="btn-primary">Create</button>
          <button @click="cancelCreate" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { listen } from '@tauri-apps/api/event'
import { emit } from '@tauri-apps/api/event'

const files = ref([])
const currentPath = ref('')
const selectedFile = ref('')
const showNewFileModal = ref(false)
const newItemName = ref('')
const isFolder = ref(false)
const newItemInput = ref(null)

const getFileIcon = (file) => {
  if (file.is_directory) {
    return '📁'
  }
  
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

const openFolder = async () => {
  const selected = await open({
    directory: true,
    multiple: false,
  })
  
  if (selected) {
    currentPath.value = selected
    await loadFiles(selected)
    await startFileWatcher(selected)
  }
}

const loadFiles = async (path) => {
  try {
    const result = await invoke('list_files', { dirPath: path })
    files.value = result
  } catch (error) {
    console.error('Failed to load files:', error)
  }
}

const startFileWatcher = async (path) => {
  try {
    await invoke('watch_path', { path })
  } catch (error) {
    console.error('Failed to start file watcher:', error)
  }
}

const handleFileClick = async (file) => {
  selectedFile.value = file.path
  
  if (file.is_directory) {
    currentPath.value = file.path
    await loadFiles(file.path)
  } else {
    await emit('file-selected', file)
  }
}

const refreshFiles = () => {
  if (currentPath.value) {
    loadFiles(currentPath.value)
  }
}

const createNewFile = () => {
  if (!currentPath.value) return
  isFolder.value = false
  newItemName.value = ''
  showNewFileModal.value = true
}

const createNewFolder = () => {
  if (!currentPath.value) return
  isFolder.value = true
  newItemName.value = ''
  showNewFileModal.value = true
}

const confirmCreate = async () => {
  if (!newItemName.value.trim()) return
  
  try {
    const itemPath = await invoke('join_paths', { 
      base: currentPath.value, 
      name: newItemName.value 
    })
    
    if (isFolder.value) {
      await invoke('create_directory', { dirPath: itemPath })
    } else {
      await invoke('create_file', { filePath: itemPath })
    }
    await loadFiles(currentPath.value)
    cancelCreate()
  } catch (error) {
    console.error('Failed to create item:', error)
    alert('Failed to create item: ' + error)
  }
}

const cancelCreate = () => {
  showNewFileModal.value = false
  newItemName.value = ''
}

const renameFile = (file) => {
  // TODO: Implement rename functionality
  console.log('Rename:', file)
}

const deleteItem = async (file) => {
  if (confirm(`Are you sure you want to delete ${file.name}?`)) {
    try {
      if (file.is_directory) {
        await invoke('delete_directory', { dirPath: file.path })
      } else {
        await invoke('delete_file', { filePath: file.path })
      }
      await loadFiles(currentPath.value)
      selectedFile.value = ''
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }
}

onMounted(async () => {
  await listen('file-change', (event) => {
    console.log('File change detected:', event.payload)
    if (currentPath.value) {
      loadFiles(currentPath.value)
    }
  })
})

watch(showNewFileModal, (val) => {
  if (val && newItemInput.value) {
    setTimeout(() => {
      newItemInput.value.focus()
    }, 100)
  }
})
</script>

<style scoped>
.file-tree-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #252526;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #3e3e42;
  background-color: #2d2d30;
}

.toolbar-btn {
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.toolbar-btn:hover {
  background-color: #3e3e42;
}

.current-path {
  padding: 8px;
  font-size: 11px;
  color: #858585;
  border-bottom: 1px solid #3e3e42;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: #1e1e1e;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 0;
  transition: background-color 0.1s;
  position: relative;
}

.file-item:hover {
  background-color: #2a2d2e;
}

.file-item.is-selected {
  background-color: #094771;
}

.file-icon {
  margin-right: 6px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #cccccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  gap: 2px;
}

.action-btn {
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0.7;
}

.action-btn:hover {
  opacity: 1;
  background-color: #3e3e42;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #858585;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}

.open-folder-btn {
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.open-folder-btn:hover {
  background-color: #1177bb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
}

.modal h3 {
  margin: 0 0 16px 0;
  color: #cccccc;
  font-size: 14px;
  font-weight: normal;
}

.modal input {
  width: 100%;
  padding: 8px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
}

.modal input:focus {
  outline: none;
  border-color: #007acc;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-primary {
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary:hover {
  background-color: #1177bb;
}

.btn-secondary {
  background-color: #3c3c3c;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-secondary:hover {
  background-color: #4c4c4c;
}
</style>
