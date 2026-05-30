<script setup lang="ts">import { Check, X, AlertCircle, Loader2 } from 'lucide-vue-next';
import type { ImageItem } from '@/types';
import { formatFileSize } from '@/utils/fileUtils';
defineProps<{
 images: ImageItem[];
}>();
const emit = defineEmits<{
 (e: 'toggle-select', id: string): void;
 (e: 'remove', id: string): void;
 (e: 'preview', image: ImageItem): void;
}>();
function getStatusClass(status: ImageItem['status']) {
 switch (status) {
 case 'completed': return 'bg-green-100 text-green-700';
 case 'processing': return 'bg-yellow-100 text-yellow-700';
 case 'error': return 'bg-red-100 text-red-700';
 default: return 'bg-gray-100 text-gray-600';
 }
}
function getStatusText(status: ImageItem['status']) {
 switch (status) {
 case 'completed': return '已完成';
 case 'processing': return '处理中';
 case 'error': return '失败';
 default: return '待处理';
 }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">图片列表</h3>
    
    <div v-if="images.length === 0" class="text-center py-12 text-gray-400">
      <p>暂无图片，请上传图片开始处理</p>
    </div>
    
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
      <div
        v-for="image in images"
        :key="image.id"
        class="relative rounded-lg border-2 overflow-hidden group cursor-pointer transition-all"
        :class="[
          image.selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
        ]"
        @click="emit('preview', image)"
      >
        <div class="aspect-square bg-gray-100">
          <img
            :src="image.processedUrl || image.originalUrl"
            :alt="image.file.name"
            class="w-full h-full object-cover"
          />
        </div>
        
        <div class="absolute top-2 left-2">
          <button
            class="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            :class="[
              image.selected 
                ? 'bg-primary-500 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white'
            ]"
            @click.stop="emit('toggle-select', image.id)"
          >
            <Check v-if="image.selected" class="w-4 h-4" />
          </button>
        </div>
        
        <button
          class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="emit('remove', image.id)"
        >
          <X class="w-4 h-4" />
        </button>
        
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p class="text-xs text-white truncate mb-1">{{ image.file.name }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-300">
              {{ formatFileSize(image.processedSize || image.originalSize) }}
            </span>
            <span 
              class="text-xs px-2 py-0.5 rounded-full"
              :class="getStatusClass(image.status)"
            >
              <Loader2 v-if="image.status === 'processing'" class="w-3 h-3 inline animate-spin" />
              <AlertCircle v-else-if="image.status === 'error'" class="w-3 h-3 inline" />
              {{ getStatusText(image.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
