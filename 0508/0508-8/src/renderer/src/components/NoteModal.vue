<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        编辑备注 - {{ material.file_name }}
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">备注内容</label>
          <textarea 
            class="textarea" 
            v-model="note" 
            placeholder="请输入备注信息..."
            rows="5"
          ></textarea>
          <div class="char-count">{{ note.length }} / 500</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="note.length > 500">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { materialApi } from '../utils/api'

const props = defineProps({
  material: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const note = ref('')

watch(() => props.material, (newVal) => {
  if (newVal) {
    note.value = newVal.note || ''
  }
}, { immediate: true })

async function handleSave() {
  if (note.value.length > 500) return

  await materialApi.updateMaterialNote(props.material.id, note.value)
  emit('saved')
  emit('close')
}
</script>

<style scoped>
.char-count {
  text-align: right;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
</style>
