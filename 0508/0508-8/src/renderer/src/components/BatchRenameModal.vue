<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal rename-modal">
      <div class="modal-header">
        批量重命名 ({{ selectedMaterials.length }} 个文件)
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">命名规则</label>
          <input 
            type="text" 
            class="input" 
            v-model="form.pattern"
            placeholder="例如: 素材_{nn}"
            @input="updatePreview"
          />
          <div class="pattern-help">
            <span class="help-title">可用变量:</span>
            <span class="pattern-tag">{n}</span>序号
            <span class="pattern-tag">{nn}</span>2位序号
            <span class="pattern-tag">{nnn}</span>3位序号
            <span class="pattern-tag">{name}</span>原文件名
            <span class="pattern-tag">{ext}</span>扩展名
            <span class="pattern-tag">{date}</span>日期
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label class="form-label">起始序号</label>
            <input 
              type="number" 
              class="input" 
              v-model.number="form.startIndex"
              min="1"
              @input="updatePreview"
            />
          </div>
          <div class="form-group half">
            <label class="form-label">预设规则</label>
            <select class="select" v-model="selectedPreset" @change="applyPreset">
              <option value="">自定义</option>
              <option value="seq">序号递增: file_01</option>
              <option value="date">日期前缀: 2024-01-01_file</option>
              <option value="prefix">前缀+序号: 素材_001</option>
              <option value="orig">保留原名: {name}_copy</option>
            </select>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-header">
            <span>预览效果</span>
            <span v-if="previewList.length > 0" class="preview-count">
              {{ previewList.length }} 个文件
            </span>
          </div>
          <div class="preview-list">
            <div v-if="previewList.length === 0" class="preview-empty">
              请输入命名规则查看预览
            </div>
            <div 
              v-for="(item, index) in previewList" 
              :key="item.id"
              class="preview-item"
            >
              <div class="preview-number">{{ index + 1 }}</div>
              <div class="preview-old" :title="item.oldName">{{ item.oldName }}</div>
              <div class="preview-arrow">→</div>
              <div class="preview-new" :title="item.newName">{{ item.newName }}</div>
            </div>
          </div>
        </div>

        <div class="warning-box" v-if="hasDuplicates">
          ⚠️ 警告：存在重名文件，可能导致重命名失败
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button 
          class="btn btn-primary" 
          @click="handleRename"
          :disabled="!form.pattern || previewList.length === 0 || isProcessing"
        >
          {{ isProcessing ? '处理中...' : '开始重命名' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { materialApi } from '../utils/api'

const props = defineProps({
  selectedMaterials: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const form = ref({
  pattern: '素材_{nn}',
  startIndex: 1
})

const selectedPreset = ref('')
const previewList = ref([])
const isProcessing = ref(false)

const presets = {
  seq: { pattern: 'file_{nn}', startIndex: 1 },
  date: { pattern: '{date}_file_{nn}', startIndex: 1 },
  prefix: { pattern: '素材_{nnn}', startIndex: 1 },
  orig: { pattern: '{name}_copy', startIndex: 1 }
}

const hasDuplicates = computed(() => {
  const names = previewList.value.map(item => item.newName.toLowerCase())
  return new Set(names).size !== names.length
})

function applyPreset() {
  if (selectedPreset.value && presets[selectedPreset.value]) {
    const preset = presets[selectedPreset.value]
    form.value.pattern = preset.pattern
    form.value.startIndex = preset.startIndex
    updatePreview()
  }
}

async function updatePreview() {
  if (!form.value.pattern || !props.selectedMaterials || props.selectedMaterials.length === 0) {
    previewList.value = []
    return
  }

  try {
    previewList.value = await materialApi.previewRename(
      props.selectedMaterials,
      {
        pattern: form.value.pattern,
        startIndex: form.value.startIndex
      }
    )
  } catch (e) {
    console.error('Preview error:', e)
    previewList.value = []
  }
}

async function handleRename() {
  if (!form.value.pattern || previewList.value.length === 0) return

  if (hasDuplicates.value) {
    if (!confirm('检测到重名文件，继续可能导致部分文件重命名失败。确定继续吗？')) {
      return
    }
  }

  if (!confirm(`确定要重命名这 ${props.selectedMaterials.length} 个文件吗？此操作无法撤销。`)) {
    return
  }

  isProcessing.value = true

  try {
    const materialIds = props.selectedMaterials.map(m => m.id)
    const result = await materialApi.batchRenameMaterials(materialIds, {
      pattern: form.value.pattern,
      startIndex: form.value.startIndex
    })

    let message = `重命名完成\n成功: ${result.successCount || result.success?.length || 0} 个`
    
    if (result.failedCount || (result.failed && result.failed.length > 0)) {
      const failedCount = result.failedCount || result.failed.length
      message += `\n失败: ${failedCount} 个`
      
      if (result.failed && result.failed.length > 0) {
        const failedDetails = result.failed.slice(0, 5).map(f => 
          `  - ${f.name}: ${f.error}`
        ).join('\n')
        message += `\n\n失败详情:\n${failedDetails}`
        if (result.failed.length > 5) {
          message += `\n  ... 还有 ${result.failed.length - 5} 个`
        }
      }
    }

    alert(message)
    
    if (result.successCount > 0 || (result.success && result.success.length > 0)) {
      emit('saved')
    }
    
    emit('close')

  } catch (error) {
    console.error('Batch rename error:', error)
    alert('重命名失败: ' + (error.message || '未知错误'))
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  updatePreview()
})

watch([() => form.value.pattern, () => form.value.startIndex], () => {
  updatePreview()
}, { deep: true })
</script>

<style scoped>
.rename-modal {
  max-width: 700px;
  width: 95%;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
}

.pattern-help {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.8;
}

.help-title {
  margin-right: 8px;
}

.pattern-tag {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 4px;
  background-color: #e2e8f0;
  border-radius: 4px;
  font-family: monospace;
  color: #475569;
}

.preview-section {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #f8fafc;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.preview-count {
  color: #94a3b8;
  font-weight: normal;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-empty {
  padding: 30px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e2e8f0;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  flex-shrink: 0;
}

.preview-old,
.preview-new {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-old {
  color: #94a3b8;
  text-decoration: line-through;
}

.preview-arrow {
  color: #3b82f6;
  font-weight: bold;
  flex-shrink: 0;
}

.preview-new {
  color: #10b981;
  font-weight: 500;
}

.warning-box {
  margin-top: 12px;
  padding: 10px 14px;
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
}
</style>
