<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        {{ tag ? '编辑标签' : '新建标签' }}
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">标签名称</label>
          <input type="text" class="input" v-model="form.name" placeholder="请输入标签名称" />
        </div>
        <div class="form-group">
          <label class="form-label">标签颜色</label>
          <div class="color-picker-wrapper">
            <span class="tag-preview" :style="{ backgroundColor: form.color }">
              {{ form.name || '标签预览' }}
            </span>
          </div>
          <div class="color-presets">
            <span 
              v-for="color in presetColors" 
              :key="color" 
              class="color-preset"
              :class="{ active: form.color === color }"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            ></span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!form.name">
          {{ tag ? '保存' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { tagApi } from '../utils/api'

const props = defineProps({
  tag: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const presetColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#6366F1', '#F97316'
]

const form = ref({
  name: '',
  color: '#10B981'
})

watch(() => props.tag, (newVal) => {
  if (newVal) {
    form.value = {
      name: newVal.name || '',
      color: newVal.color || '#10B981'
    }
  } else {
    form.value = {
      name: '',
      color: '#10B981'
    }
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.name.trim()) return

  if (props.tag) {
    await tagApi.update(props.tag.id, form.value)
  } else {
    await tagApi.create(form.value)
  }

  emit('saved')
  emit('close')
}
</script>

<style scoped>
.color-picker-wrapper {
  margin-bottom: 12px;
}

.tag-preview {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: white;
  min-width: 100px;
  text-align: center;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #1e293b;
}
</style>
