<template>
  <div class="categories-view">
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">分类管理</h2>
        <span class="item-count">共 {{ categories.length }} 个分类</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          ➕ 新建分类
        </button>
      </div>
    </div>

    <div class="categories-content">
      <div v-if="categories.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-text">暂无分类，点击"新建分类"添加</div>
      </div>

      <div v-else class="categories-list">
        <div v-for="category in categories" :key="category.id" class="category-item card">
          <div class="category-color" :style="{ backgroundColor: category.color }"></div>
          <div class="category-info">
            <div class="category-name">{{ category.name }}</div>
            <div class="category-desc" v-if="category.description">{{ category.description }}</div>
            <div class="category-meta">
              <span class="material-count">{{ category.material_count }} 个素材</span>
            </div>
          </div>
          <div class="category-actions">
            <button class="action-btn" @click="editCategory(category)">✏️</button>
            <button 
              class="action-btn action-delete" 
              @click="deleteCategory(category)"
              :disabled="category.material_count > 0"
              :title="category.material_count > 0 ? '分类下有素材，无法删除' : '删除分类'"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <CategoryModal 
      v-if="showModal" 
      :category="editingCategory" 
      @close="closeModal"
      @saved="loadCategories"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryApi } from '../utils/api'
import CategoryModal from '../components/CategoryModal.vue'

const categories = ref([])
const showModal = ref(false)
const editingCategory = ref(null)

async function loadCategories() {
  categories.value = await categoryApi.getAll()
}

function openCreateModal() {
  editingCategory.value = null
  showModal.value = true
}

function editCategory(category) {
  editingCategory.value = { ...category }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCategory.value = null
}

async function deleteCategory(category) {
  if (confirm(`确定要删除分类 "${category.name}" 吗？`)) {
    await categoryApi.delete(category.id)
    await loadCategories()
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-view {
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

.categories-content {
  flex: 1;
  overflow-y: auto;
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.category-item {
  display: flex;
  padding: 16px;
  gap: 16px;
  align-items: flex-start;
}

.category-color {
  width: 8px;
  height: 48px;
  border-radius: 4px;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.category-desc {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
  line-height: 1.4;
}

.category-meta {
  font-size: 12px;
  color: #94a3b8;
}

.category-actions {
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

.action-btn:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-delete:hover:not(:disabled) {
  background-color: #fee2e2;
}
</style>
