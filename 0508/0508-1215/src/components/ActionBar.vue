<script setup lang="ts">
import { Play, Download, Trash2, CheckSquare, Square } from 'lucide-vue-next'

defineProps<{
  selectedCount: number
  totalCount: number
  completedCount: number
  isProcessing: boolean
  isDownloading: boolean
  processingProgress: number
}>()

const emit = defineEmits<{
  (e: 'select-all'): void
  (e: 'deselect-all'): void
  (e: 'process'): void
  (e: 'download'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          @click="selectedCount === totalCount ? emit('deselect-all') : emit('select-all')"
        >
          <CheckSquare v-if="selectedCount === totalCount && totalCount > 0" class="w-4 h-4" />
          <Square v-else class="w-4 h-4" />
          {{ selectedCount === totalCount && totalCount > 0 ? '取消全选' : '全选' }}
        </button>
        
        <span class="text-sm text-gray-500">
          已选择 {{ selectedCount }} / {{ totalCount }} 张
        </span>
        
        <span class="text-sm text-gray-400">|</span>
        
        <span class="text-sm text-gray-500">
          已完成 {{ completedCount }} 张
        </span>
      </div>
      
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          :disabled="totalCount === 0"
          :class="{ 'opacity-50 cursor-not-allowed': totalCount === 0 }"
          @click="emit('clear')"
        >
          <Trash2 class="w-4 h-4" />
          清空
        </button>
        
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          :disabled="selectedCount === 0 || isProcessing"
          :class="{ 'opacity-50 cursor-not-allowed': selectedCount === 0 || isProcessing }"
          @click="emit('process')"
        >
          <Play class="w-4 h-4" :class="{ 'animate-spin': isProcessing }" />
          {{ isProcessing ? '处理中...' : '开始处理' }}
        </button>
        
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          :disabled="completedCount === 0 || isDownloading"
          :class="{ 'opacity-50 cursor-not-allowed': completedCount === 0 || isDownloading }"
          @click="emit('download')"
        >
          <Download class="w-4 h-4" :class="{ 'animate-bounce': isDownloading }" />
          {{ isDownloading ? '下载中...' : '批量下载' }}
        </button>
      </div>
    </div>
    
    <div v-if="isProcessing" class="mt-4">
      <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>处理进度</span>
        <span>{{ Math.round(processingProgress) }}%</span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${processingProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
