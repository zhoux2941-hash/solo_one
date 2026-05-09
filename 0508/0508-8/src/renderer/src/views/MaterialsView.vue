<template>
  <div class="materials-view">
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">素材管理</h2>
        <span class="material-count">共 {{ materials.length }} 个素材</span>
        <span v-if="selectedIds.length > 0" class="selected-count">
          已选 {{ selectedIds.length }} 个
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="selectedIds.length > 0" 
          class="btn btn-outline btn-sm" 
          @click="clearSelection"
        >
          取消选择
        </button>
        <button 
          v-if="selectedIds.length > 0" 
          class="btn btn-secondary btn-sm" 
          @click="openBatchRename"
        >
          🔄 批量重命名
        </button>
        <button class="btn btn-outline btn-sm" @click="refreshData">
          🔄 刷新
        </button>
        <button class="btn btn-primary btn-sm" @click="handleImport">
          ➕ 导入素材
        </button>
      </div>
    </div>

    <div class="filters-bar card">
      <div class="filter-item">
        <input 
          type="text" 
          class="input" 
          placeholder="🔍 搜索文件名、备注或标签..." 
          v-model="searchQuery"
          @input="handleSearch"
        />
      </div>
      <div class="filter-item">
        <select class="select" v-model="filterCategory" @change="loadMaterials">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }} ({{ cat.material_count }})
          </option>
        </select>
      </div>
      <div class="filter-item">
        <select class="select" v-model="filterType" @change="loadMaterials">
          <option value="">全部类型</option>
          <option value="image">图片</option>
          <option value="audio">音频</option>
          <option value="document">文档</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>

    <div class="materials-content">
      <div v-if="materials.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无素材，点击"导入素材"添加文件</div>
      </div>

      <div v-else class="materials-grid">
        <div 
          v-for="material in materials" 
          :key="material.id" 
          class="material-card card"
          :class="{ selected: selectedIds.includes(material.id) }"
          @click="toggleSelect(material.id, $event)"
        >
          <div class="select-indicator">
            <input 
              type="checkbox" 
              :checked="selectedIds.includes(material.id)"
              @click.stop
              @change="toggleSelect(material.id, $event)"
            />
          </div>
          <div class="card-preview" @click.stop="openFile(material)">
            <template v-if="material.thumbnail_path">
              <img 
                :src="getThumbnailUrl(material.thumbnail_path)" 
                :alt="material.file_name"
                class="preview-image"
              />
            </template>
            <template v-else>
              <span class="preview-icon">{{ getFileIcon(material.file_type) }}</span>
            </template>
            <div class="preview-overlay">
              <span class="preview-tip">点击打开</span>
            </div>
          </div>

          <div class="card-info">
            <div class="file-name" :title="material.file_name">{{ material.file_name }}</div>
            <div class="file-meta">
              <span class="file-type">{{ getFileTypeLabel(material.file_type) }}</span>
              <span class="file-size">{{ formatFileSize(material.file_size) }}</span>
            </div>
            
            <div v-if="material.category_name" class="category-badge" :style="{ backgroundColor: material.category_color }">
              {{ material.category_name }}
            </div>

            <div class="tags-container" v-if="material.tags && material.tags.length > 0">
              <span 
                v-for="tag in material.tags" 
                :key="tag.id" 
                class="tag"
                :style="{ backgroundColor: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button class="action-btn" title="编辑备注" @click="editNote(material)">
              📝
            </button>
            <button class="action-btn" title="管理标签" @click="manageTags(material)">
              🏷️
            </button>
            <button class="action-btn action-delete" title="删除" @click="deleteMaterial(material)">
              🗑️
            </button>
          </div>

          <div v-if="material.note" class="card-note" @click="editNote(material)">
            <span class="note-label">备注:</span> {{ material.note }}
          </div>
        </div>
      </div>
    </div>

    <NoteModal 
      v-if="showNoteModal" 
      :material="currentMaterial" 
      @close="showNoteModal = false"
      @saved="refreshData"
    />

    <TagsModal 
      v-if="showTagsModal" 
      :material="currentMaterial" 
      :all-tags="allTags"
      @close="showTagsModal = false"
      @saved="refreshData"
    />

    <BatchRenameModal 
      v-if="showBatchRenameModal" 
      :selected-materials="selectedMaterials"
      @close="showBatchRenameModal = false"
      @saved="handleBatchRenameSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { fileApi, materialApi, categoryApi, tagApi, materialTagApi } from '../utils/api'
import { formatFileSize, getFileIcon, getFileTypeLabel, pathToFileURL, debounce } from '../utils/helpers'
import NoteModal from '../components/NoteModal.vue'
import TagsModal from '../components/TagsModal.vue'
import BatchRenameModal from '../components/BatchRenameModal.vue'

const materials = ref([])
const categories = ref([])
const allTags = ref([])
const searchQuery = ref('')
const filterCategory = ref('')
const filterType = ref('')

const selectedIds = ref([])

const showNoteModal = ref(false)
const showTagsModal = ref(false)
const showBatchRenameModal = ref(false)
const currentMaterial = ref(null)

const selectedMaterials = computed(() => {
  return materials.value.filter(m => selectedIds.value.includes(m.id))
})

const getThumbnailUrl = (path) => pathToFileURL(path)

async function loadCategories() {
  categories.value = await categoryApi.getAll()
}

async function loadAllTags() {
  allTags.value = await tagApi.getAll()
}

async function loadMaterials() {
  let results
  if (searchQuery.value) {
    results = await materialApi.searchMaterials(searchQuery.value)
  } else {
    const filters = {}
    if (filterCategory.value) filters.category_id = parseInt(filterCategory.value)
    if (filterType.value) filters.file_type = filterType.value
    results = await materialApi.getAllMaterials(filters)
  }

  for (const material of results) {
    material.tags = await materialTagApi.getByMaterial(material.id)
  }

  materials.value = results
}

async function refreshData() {
  await Promise.all([
    loadCategories(),
    loadAllTags(),
    loadMaterials()
  ])
}

const handleSearch = debounce(async () => {
  await loadMaterials()
}, 300)

async function handleImport() {
  const files = await fileApi.selectFiles()
  if (files && files.length > 0) {
    const result = await materialApi.importMaterials(files)
    
    let importedCount = 0
    let failedCount = 0
    let failedFiles = []
    
    if (result && typeof result === 'object') {
      importedCount = result.success || result.imported?.length || 0
      failedCount = result.failed?.length || 0
      failedFiles = result.failed || []
    } else if (Array.isArray(result)) {
      importedCount = result.length
    }
    
    let message = `导入完成：成功 ${importedCount} 个`
    if (failedCount > 0) {
      message += `，失败 ${failedCount} 个`
      if (failedFiles.length > 0) {
        const failedNames = failedFiles.slice(0, 5).map(f => 
          `  - ${f.path?.split(/[/\\]/).pop() || '未知文件'}: ${f.error || '未知错误'}`
        ).join('\n')
        message += `\n\n失败文件：\n${failedNames}`
        if (failedFiles.length > 5) {
          message += `\n  ... 还有 ${failedFiles.length - 5} 个文件`
        }
      }
    }
    
    if (importedCount > 0 || failedCount > 0) {
      alert(message)
    }
    
    if (importedCount > 0) {
      await refreshData()
    }
  }
}

async function openFile(material) {
  await materialApi.openMaterialFile(material.id)
}

function editNote(material) {
  currentMaterial.value = material
  showNoteModal.value = true
}

function manageTags(material) {
  currentMaterial.value = material
  showTagsModal.value = true
}

async function deleteMaterial(material) {
  if (confirm(`确定要删除素材 "${material.file_name}" 吗？`)) {
    await materialApi.deleteMaterial(material.id)
    selectedIds.value = selectedIds.value.filter(id => id !== material.id)
    await refreshData()
  }
}

function toggleSelect(id, event) {
  if (event.target.closest('.card-actions')) return
  
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function clearSelection() {
  selectedIds.value = []
}

function openBatchRename() {
  if (selectedIds.value.length === 0) return
  showBatchRenameModal.value = true
}

async function handleBatchRenameSaved() {
  selectedIds.value = []
  await refreshData()
}

onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.materials-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-title {
  font-size: 20px;
  font-weight: 600;
}

.material-count {
  font-size: 13px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-bar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.filter-item {
  flex: 1;
  min-width: 0;
}

.materials-content {
  flex: 1;
  overflow-y: auto;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.selected-count {
  font-size: 13px;
  color: #3b82f6;
  background-color: #dbeafe;
  padding: 2px 10px;
  border-radius: 12px;
}

.material-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.material-card.selected {
  box-shadow: 0 0 0 3px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2);
}

.select-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.select-indicator input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.card-preview {
  height: 160px;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-icon {
  font-size: 48px;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-preview:hover .preview-overlay {
  opacity: 1;
}

.preview-tip {
  color: white;
  font-size: 13px;
}

.card-info {
  padding: 12px;
  flex: 1;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: white;
  margin-bottom: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.material-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.action-delete:hover {
  background-color: #fee2e2;
}

.card-note {
  padding: 8px 12px;
  background-color: #fef3c7;
  font-size: 12px;
  color: #92400e;
  cursor: pointer;
  border-top: 1px solid #fde68a;
}

.note-label {
  font-weight: 500;
}
</style>
