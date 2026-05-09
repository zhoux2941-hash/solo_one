<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        管理标签 - {{ material.file_name }}
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">已关联标签</label>
          <div v-if="selectedTags.length === 0" class="no-tags">
            暂无关联标签
          </div>
          <div v-else class="selected-tags">
            <span 
              v-for="tag in selectedTags" 
              :key="tag.id" 
              class="tag tag-removable"
              :style="{ backgroundColor: tag.color }"
              @click="removeTag(tag.id)"
            >
              {{ tag.name }}
              <span class="remove-icon">×</span>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">可用标签</label>
          <div class="new-tag-row">
            <input 
              type="text" 
              class="input" 
              v-model="newTagName" 
              placeholder="创建新标签..."
              @keyup.enter="createNewTag"
            />
            <button class="btn btn-primary btn-sm" @click="createNewTag" :disabled="!newTagName.trim()">
              创建
            </button>
          </div>
        </div>

        <div class="form-group">
          <div class="available-tags">
            <div 
              v-for="tag in availableTags" 
              :key="tag.id" 
              class="available-tag-item"
              :class="{ disabled: isTagSelected(tag.id) }"
              @click="!isTagSelected(tag.id) && addTag(tag)"
            >
              <span class="tag" :style="{ backgroundColor: tag.color }">
                {{ tag.name }}
              </span>
              <span class="tag-count">({{ tag.material_count }})</span>
              <span v-if="isTagSelected(tag.id)" class="tag-status">已添加</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { materialTagApi, tagApi } from '../utils/api'

const props = defineProps({
  material: {
    type: Object,
    required: true
  },
  allTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'saved'])

const selectedTags = ref([])
const newTagName = ref('')

const availableTags = computed(() => {
  return props.allTags
})

watch(() => props.material, async (newVal) => {
  if (newVal) {
    selectedTags.value = await materialTagApi.getByMaterial(newVal.id)
  }
}, { immediate: true })

function isTagSelected(tagId) {
  return selectedTags.value.some(t => t.id === tagId)
}

async function addTag(tag) {
  if (isTagSelected(tag.id)) return
  
  await materialTagApi.addTags(props.material.id, [tag.id])
  selectedTags.value = await materialTagApi.getByMaterial(props.material.id)
  emit('saved')
}

async function removeTag(tagId) {
  await materialTagApi.removeTag(props.material.id, tagId)
  selectedTags.value = await materialTagApi.getByMaterial(props.material.id)
  emit('saved')
}

async function createNewTag() {
  if (!newTagName.value.trim()) return
  
  const newTag = await tagApi.create({
    name: newTagName.value.trim(),
    color: getRandomColor()
  })
  
  if (newTag) {
    await addTag(newTag)
    newTagName.value = ''
    emit('saved')
  }
}

function getRandomColor() {
  const colors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style scoped>
.no-tags {
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 0;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.tag-removable {
  cursor: pointer;
}

.remove-icon {
  margin-left: 4px;
  font-weight: bold;
  font-size: 14px;
}

.new-tag-row {
  display: flex;
  gap: 10px;
}

.available-tags {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
}

.available-tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.available-tag-item:hover:not(.disabled) {
  background-color: #f8fafc;
}

.available-tag-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tag-count {
  font-size: 12px;
  color: #94a3b8;
}

.tag-status {
  font-size: 12px;
  color: #10B981;
  margin-left: auto;
}
</style>
