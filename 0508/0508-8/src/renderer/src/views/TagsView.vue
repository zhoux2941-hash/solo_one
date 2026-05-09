<template>
  <div class="tags-view">
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">标签管理</h2>
        <span class="item-count">共 {{ tags.length }} 个标签</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          ➕ 新建标签
        </button>
      </div>
    </div>

    <div class="tags-content">
      <div v-if="tags.length === 0" class="empty-state">
        <div class="empty-state-icon">🏷️</div>
        <div class="empty-state-text">暂无标签，点击"新建标签"添加</div>
      </div>

      <div v-else class="tags-list">
        <div v-for="tag in tags" :key="tag.id" class="tag-item card">
          <div class="tag-info">
            <span class="tag-display" :style="{ backgroundColor: tag.color }">
              {{ tag.name }}
            </span>
            <span class="material-count">{{ tag.material_count }} 个素材</span>
          </div>
          <div class="tag-actions">
            <button class="action-btn" @click="editTag(tag)">✏️</button>
            <button class="action-btn action-delete" @click="deleteTag(tag)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <TagModal 
      v-if="showModal" 
      :tag="editingTag" 
      @close="closeModal"
      @saved="loadTags"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { tagApi } from '../utils/api'
import TagModal from '../components/TagModal.vue'

const tags = ref([])
const showModal = ref(false)
const editingTag = ref(null)

async function loadTags() {
  tags.value = await tagApi.getAll()
}

function openCreateModal() {
  editingTag.value = null
  showModal.value = true
}

function editTag(tag) {
  editingTag.value = { ...tag }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTag.value = null
}

async function deleteTag(tag) {
  if (confirm(`确定要删除标签 "${tag.name}" 吗？\n该标签将从所有关联素材中移除。`)) {
    await tagApi.delete(tag.id)
    await loadTags()
  }
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tags-view {
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

.item-count {
  font-size: 13px;
  color: #64748b;
}

.tags-content {
  flex: 1;
  overflow-y: auto;
}

.tags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-display {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: white;
  font-weight: 500;
}

.material-count {
  font-size: 12px;
  color: #94a3b8;
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.action-btn:hover {
  background-color: #e2e8f0;
}

.action-delete:hover {
  background-color: #fee2e2;
}
</style>
