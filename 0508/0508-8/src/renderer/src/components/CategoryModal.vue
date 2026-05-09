<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        {{ category ? '编辑分类' : '新建分类' }}
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">分类名称</label>
          <input type="text" class="input" v-model="form.name" placeholder="请输入分类名称" />
        </div>
        <div class="form-group">
          <label class="form-label">分类颜色</label>
          <div class="color-picker-wrapper">
            <div class="color-preview" :style="{ backgroundColor: form.color }"></div>
            <input type="color" v-model="form.color" class="color-input" />
            <input type="text" class="input color-text" v-model="form.color" placeholder="#3B82F6" />
          </div>
          <div class="color-presets">
            <span 
              v-for="color in presetColors" 
              :key="color" 
              class="color-preset"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            ></span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">分类描述 (可选)</label>
          <textarea class="textarea" v-model="form.description" placeholder="请输入分类描述"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!form.name">
          {{ category ? '保存' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { categoryApi } from '../utils/api'

const props = defineProps({
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const presetColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
]

const form = ref({
  name: '',
  description: '',
  color: '#3B82F6'
})

watch(() => props.category, (newVal) => {
  if (newVal) {
    form.value = {
      name: newVal.name || '',
      description: newVal.description || '',
      color: newVal.color || '#3B82F6'
    }
  } else {
    form.value = {
      name: '',
      description: '',
      color: '#3B82F6'
    }
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.name.trim()) return

  if (props.category) {
    await categoryApi.update(props.category.id, form.value)
  } else {
    await categoryApi.create(form.value)
  }

  emit('saved')
  emit('close')
}
</script>

<style scoped>
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.color-input {
  width: 40px;
  height: 36px;
  border: none;
  padding: 0;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.color-presets {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.color-preset {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-preset:hover {
  border-color: #64748b;
}
</style>
