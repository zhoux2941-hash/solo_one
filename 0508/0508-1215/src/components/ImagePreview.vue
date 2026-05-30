<script setup lang="ts">
import { computed } from 'vue'
import { X, ArrowLeftRight, TrendingDown } from 'lucide-vue-next'
import type { ImageItem } from '@/types'
import { formatFileSize } from '@/utils/fileUtils'

const props = defineProps<{
  image: ImageItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const sizeReduction = computed(() => {
  if (!props.image || !props.image.processedSize) return null
  const reduction = ((props.image.originalSize - props.image.processedSize) / props.image.originalSize) * 100
  return reduction.toFixed(1)
})
</script>

<template>
  <Transition name="modal">
    <div 
      v-if="image"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">图片预览对比</h3>
          <button 
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            @click="emit('close')"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div class="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-700">原图</h4>
                <span class="text-sm text-gray-500">{{ formatFileSize(image.originalSize) }}</span>
              </div>
              <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  :src="image.originalUrl" 
                  :alt="image.file.name"
                  class="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-700">处理后</h4>
                <span class="text-sm text-gray-500">
                  {{ image.processedSize ? formatFileSize(image.processedSize) : '-' }}
                  <span v-if="sizeReduction" class="ml-2 text-green-600 flex items-center gap-1">
                    <TrendingDown class="w-4 h-4" />
                    -{{ sizeReduction }}%
                  </span>
                </span>
              </div>
              <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  v-if="image.processedUrl"
                  :src="image.processedUrl" 
                  :alt="image.file.name"
                  class="w-full h-full object-contain"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  等待处理...
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
            <ArrowLeftRight class="w-5 h-5 text-primary-500" />
            <span>拖动对比</span>
          </div>
          
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">文件名:</span>
                <span class="ml-2 text-gray-700">{{ image.file.name }}</span>
              </div>
              <div>
                <span class="text-gray-500">状态:</span>
                <span 
                  class="ml-2 px-2 py-0.5 rounded-full text-xs"
                  :class="{
                    'bg-green-100 text-green-700': image.status === 'completed',
                    'bg-yellow-100 text-yellow-700': image.status === 'processing',
                    'bg-red-100 text-red-700': image.status === 'error',
                    'bg-gray-100 text-gray-600': image.status === 'pending'
                  }"
                >
                  {{ image.status === 'completed' ? '已完成' : 
                     image.status === 'processing' ? '处理中' : 
                     image.status === 'error' ? '失败' : '待处理' }}
                </span>
              </div>
              <div>
                <span class="text-gray-500">原大小:</span>
                <span class="ml-2 text-gray-700">{{ formatFileSize(image.originalSize) }}</span>
              </div>
              <div>
                <span class="text-gray-500">处理后:</span>
                <span class="ml-2 text-gray-700">{{ image.processedSize ? formatFileSize(image.processedSize) : '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
