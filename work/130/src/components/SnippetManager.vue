<template>
  <div class="snippet-manager-container">
    <div class="snippet-header">
      <div class="header-title">
        <span class="title-icon">📋</span>
        <span class="title-text">Code Snippets</span>
      </div>
      <div class="header-actions">
        <button @click="openCreateModal" class="create-btn" title="New Snippet">
          ➕ New Snippet
        </button>
      </div>
    </div>
    
    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search by title, description, or content..."
        class="search-input"
        @input="searchSnippets"
      />
      
      <div class="filter-section">
        <select v-model="filterLanguage" class="filter-select" @change="searchSnippets">
          <option value="">All Languages</option>
          <option v-for="lang in allLanguages" :key="lang" :value="lang">{{ lang }}</option>
        </select>
        
        <div class="tag-filter">
          <button 
            v-for="tag in allTags" 
            :key="tag"
            @click="toggleTagFilter(tag)"
            class="tag-chip"
            :class="{ 'active': selectedTags.includes(tag) }"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="snippet-list" v-if="snippets.length > 0">
      <div 
        v-for="snippet in snippets" 
        :key="snippet.id"
        class="snippet-item"
        :class="{ 'selected': selectedSnippet?.id === snippet.id }"
        @click="selectSnippet(snippet)"
      >
        <div class="snippet-header-row">
          <span class="snippet-title">{{ snippet.title }}</span>
          <span class="snippet-language">{{ snippet.language }}</span>
        </div>
        <div class="snippet-preview" v-if="snippet.description">
          {{ snippet.description }}
        </div>
        <div class="snippet-tags" v-if="snippet.tags?.length > 0">
          <span 
            v-for="tag in snippet.tags" 
            :key="tag"
            class="snippet-tag"
          >
            #{{ tag }}
          </span>
        </div>
        <div class="snippet-actions">
          <button @click.stop="insertSnippet(snippet)" class="insert-btn" title="Insert">
            📥 Insert
          </button>
          <button @click.stop="openEditModal(snippet)" class="edit-btn" title="Edit">
            ✏️
          </button>
          <button @click.stop="deleteSnippet(snippet.id)" class="delete-btn" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <div class="snippet-empty" v-else>
      <div class="empty-icon">📭</div>
      <p>No snippets found</p>
      <p class="empty-hint">Create your first code snippet or try adjusting filters</p>
    </div>
    
    <div v-if="selectedSnippet && !showCreateModal && !showEditModal" class="snippet-detail">
      <div class="detail-header">
        <h3>{{ selectedSnippet.title }}</h3>
        <div class="detail-meta">
          <span class="detail-language">{{ selectedSnippet.language }}</span>
          <span class="detail-date">Updated: {{ formatDate(selectedSnippet.updated_at) }}</span>
        </div>
      </div>
      <div class="detail-description" v-if="selectedSnippet.description">
        {{ selectedSnippet.description }}
      </div>
      <div class="detail-tags" v-if="selectedSnippet.tags?.length > 0">
        <span 
          v-for="tag in selectedSnippet.tags" 
          :key="tag"
          class="detail-tag"
        >
          #{{ tag }}
        </span>
      </div>
      <div class="detail-code">
        <pre><code>{{ selectedSnippet.content }}</code></pre>
      </div>
      <div class="detail-actions">
        <button @click="insertSnippet(selectedSnippet)" class="insert-btn-large">
          📥 Insert into Editor
        </button>
        <button @click="copySnippet(selectedSnippet)" class="copy-btn">
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
    
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showCreateModal ? 'New Snippet' : 'Edit Snippet' }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="snippet-title">Title *</label>
            <input 
              id="snippet-title"
              v-model="formData.title" 
              type="text" 
              placeholder="Enter snippet title"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="snippet-description">Description</label>
            <textarea 
              id="snippet-description"
              v-model="formData.description" 
              placeholder="Enter description (optional)"
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="snippet-language">Language</label>
              <select id="snippet-language" v-model="formData.language" class="form-select">
                <option value="plaintext">Plain Text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="vue">Vue</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="snippet-tags">Tags (comma separated)</label>
              <input 
                id="snippet-tags"
                v-model="formData.tagsInput" 
                type="text" 
                placeholder="e.g., function, utility, example"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="snippet-content">Code *</label>
            <textarea 
              id="snippet-content"
              v-model="formData.content" 
              placeholder="Paste your code here"
              class="form-textarea code-area"
              rows="12"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">
            Cancel
          </button>
          <button @click="saveSnippet" class="btn-primary" :disabled="!formData.title || !formData.content">
            {{ showCreateModal ? 'Create Snippet' : 'Update Snippet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { emit } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

const snippets = ref([])
const allTags = ref([])
const allLanguages = ref([])
const selectedSnippet = ref(null)

const searchQuery = ref('')
const filterLanguage = ref('')
const selectedTags = ref([])

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingSnippet = ref(null)

const formData = ref({
  title: '',
  description: '',
  language: 'plaintext',
  tagsInput: '',
  content: '',
})

const loadSnippets = async () => {
  try {
    const result = await invoke('list_snippets')
    snippets.value = result
  } catch (error) {
    console.error('Failed to load snippets:', error)
  }
}

const loadTags = async () => {
  try {
    const result = await invoke('get_all_tags')
    allTags.value = result
  } catch (error) {
    console.error('Failed to load tags:', error)
  }
}

const loadLanguages = async () => {
  try {
    const result = await invoke('get_all_languages')
    allLanguages.value = result
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

const searchSnippets = async () => {
  try {
    const query = searchQuery.value.trim() || null
    const language = filterLanguage.value || null
    const tags = selectedTags.value.length > 0 ? selectedTags.value : null
    
    const result = await invoke('search_snippets', { query, tags, language })
    snippets.value = result
  } catch (error) {
    console.error('Failed to search snippets:', error)
  }
}

const toggleTagFilter = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  searchSnippets()
}

const selectSnippet = (snippet) => {
  selectedSnippet.value = snippet
}

const openCreateModal = () => {
  formData.value = {
    title: '',
    description: '',
    language: 'plaintext',
    tagsInput: '',
    content: '',
  }
  showCreateModal.value = true
}

const openEditModal = (snippet) => {
  editingSnippet.value = snippet
  formData.value = {
    title: snippet.title,
    description: snippet.description || '',
    language: snippet.language,
    tagsInput: snippet.tags?.join(', ') || '',
    content: snippet.content,
  }
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingSnippet.value = null
}

const saveSnippet = async () => {
  if (!formData.value.title || !formData.value.content) return
  
  const tags = formData.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
  
  try {
    if (showCreateModal.value) {
      await invoke('create_snippet', {
        title: formData.value.title,
        content: formData.value.content,
        language: formData.value.language || null,
        description: formData.value.description || null,
        tags: tags.length > 0 ? tags : null,
      })
    } else if (showEditModal.value && editingSnippet.value) {
      await invoke('update_snippet', {
        id: editingSnippet.value.id,
        title: formData.value.title,
        content: formData.value.content,
        language: formData.value.language || null,
        description: formData.value.description || null,
        tags: tags.length > 0 ? tags : null,
      })
    }
    
    closeModal()
    await loadSnippets()
    await loadTags()
    await loadLanguages()
  } catch (error) {
    console.error('Failed to save snippet:', error)
    alert('Failed to save snippet: ' + error)
  }
}

const deleteSnippet = async (id) => {
  if (!confirm('Are you sure you want to delete this snippet?')) return
  
  try {
    await invoke('delete_snippet', { id })
    if (selectedSnippet.value?.id === id) {
      selectedSnippet.value = null
    }
    await loadSnippets()
    await loadTags()
    await loadLanguages()
  } catch (error) {
    console.error('Failed to delete snippet:', error)
    alert('Failed to delete snippet: ' + error)
  }
}

const insertSnippet = (snippet) => {
  emit('insert-snippet', snippet)
}

const copySnippet = async (snippet) => {
  try {
    await navigator.clipboard.writeText(snippet.content)
    alert('Copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy:', error)
    alert('Failed to copy: ' + error)
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const openCreateModalWithContent = (content, language) => {
  formData.value = {
    title: '',
    description: '',
    language: language || 'plaintext',
    tagsInput: '',
    content: content || '',
  }
  showCreateModal.value = true
}

onMounted(async () => {
  await loadSnippets()
  await loadTags()
  await loadLanguages()
  
  await listen('save-selected-code', (event) => {
    const { content, language } = event.payload
    openCreateModalWithContent(content, language)
  })
})
</script>

<style scoped>
.snippet-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  overflow: hidden;
}

.snippet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
}

.create-btn {
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #1177bb;
}

.search-bar {
  padding: 12px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 8px;
}

.search-input:focus {
  outline: none;
  border-color: #007acc;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-select {
  padding: 6px 10px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  padding: 3px 8px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #858585;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  background-color: #4c4c4c;
  color: #cccccc;
}

.tag-chip.active {
  background-color: #0e639c;
  color: white;
  border-color: #0e639c;
}

.snippet-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.snippet-item {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.snippet-item:hover {
  border-color: #007acc;
  background-color: #2a2d2e;
}

.snippet-item.selected {
  border-color: #007acc;
  background-color: #094771;
}

.snippet-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.snippet-title {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
}

.snippet-language {
  font-size: 11px;
  color: #4fc1ff;
  background-color: rgba(79, 193, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.snippet-preview {
  font-size: 12px;
  color: #858585;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.snippet-tag {
  font-size: 10px;
  color: #ce9178;
  background-color: rgba(206, 145, 120, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.snippet-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.insert-btn, .edit-btn, .delete-btn {
  background: none;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0.8;
  transition: all 0.2s;
}

.insert-btn:hover, .edit-btn:hover, .delete-btn:hover {
  opacity: 1;
  background-color: #3e3e42;
}

.insert-btn {
  border-color: #4ec9b0;
  color: #4ec9b0;
}

.insert-btn:hover {
  background-color: rgba(78, 201, 176, 0.1);
}

.snippet-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #6e6e6e;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 12px;
  color: #4e4e4e;
  margin-top: 8px;
}

.snippet-detail {
  background-color: #252526;
  border-top: 1px solid #3e3e42;
  padding: 16px;
  flex-shrink: 0;
  max-height: 40%;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 12px;
}

.detail-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #cccccc;
}

.detail-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #858585;
}

.detail-language {
  color: #4fc1ff;
}

.detail-description {
  font-size: 13px;
  color: #d4d4d4;
  margin-bottom: 12px;
  padding: 8px;
  background-color: #1e1e1e;
  border-radius: 4px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.detail-tag {
  font-size: 11px;
  color: #ce9178;
  background-color: rgba(206, 145, 120, 0.15);
  padding: 3px 8px;
  border-radius: 4px;
}

.detail-code {
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.detail-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-code code {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: #d4d4d4;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.insert-btn-large, .copy-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.insert-btn-large {
  background-color: #0e639c;
  color: white;
}

.insert-btn-large:hover {
  background-color: #1177bb;
}

.copy-btn {
  background-color: #3c3c3c;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
}

.copy-btn:hover {
  background-color: #4c4c4c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #cccccc;
}

.close-btn {
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  font-size: 20px;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.7;
}

.close-btn:hover {
  opacity: 1;
  background-color: #3e3e42;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #858585;
  margin-bottom: 6px;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 8px 12px;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #007acc;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.form-textarea.code-area {
  font-family: 'Consolas', 'Courier New', monospace;
  min-height: 200px;
}

.form-select {
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #3e3e42;
  flex-shrink: 0;
}

.btn-primary, .btn-secondary {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #0e639c;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1177bb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #3c3c3c;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
}

.btn-secondary:hover {
  background-color: #4c4c4c;
}
</style>
