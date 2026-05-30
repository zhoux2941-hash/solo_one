<script setup lang="ts">
import { ref } from 'vue'
import { Upload, ImageIcon } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'upload', files: FileList): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}

function handleClick() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('upload', files)
    target.value = ''
  }
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer"
    :class="[
      isDragging 
        ? 'border-primary-500 bg-primary-50' 
        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />
    <div class="flex flex-col items-center gap-4">
      <div 
        class="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
        :class="isDragging ? 'bg-primary-500' : 'bg-primary-100'"
      >
        <Upload 
          class="w-8 h-8" 
          :class="isDragging ? 'text-white' : 'text-primary-600'"
        />
      </div>
      <div>
        <p class="text-lg font-medium text-gray-700">拖拽图片到这里</p>
        <p class="text-sm text-gray-500 mt-1">或点击选择文件</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-400">
        <ImageIcon class="w-4 h-4" />
        <span>支持 PNG、JPG、WebP 格式</span>
      </div>
    </div>
  </div>
</template>
