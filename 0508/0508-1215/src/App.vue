<script setup lang="ts">
import { ref } from 'vue'
import { ImageIcon, Sparkles } from 'lucide-vue-next'
import type { ProcessOptions, ImageItem } from '@/types'
import { useImageProcessor } from '@/composables/useImageProcessor'
import { useZipDownload } from '@/composables/useZipDownload'
import ImageUploader from '@/components/ImageUploader.vue'
import ProcessSettings from '@/components/ProcessSettings.vue'
import ImageList from '@/components/ImageList.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import ActionBar from '@/components/ActionBar.vue'

const {
  images,
  isProcessing,
  processingProgress,
  selectedImages,
  completedImages,
  addImages,
  removeImage,
  clearAll,
  toggleSelect,
  selectAll,
  deselectAll,
  processSelectedImages
} = useImageProcessor()

const { isDownloading, downloadAsZip } = useZipDownload()

const processOptions = ref<ProcessOptions>({
  format: 'original',
  quality: 80,
  resizeMode: 'none',
  width: null,
  height: null,
  maintainRatio: true,
  renameTemplate: '{{name}}_{{seq}}',
  sequenceStart: 1,
  sequencePadding: 1
})

const previewImage = ref<ImageItem | null>(null)

function handleUpload(files: FileList) {
  addImages(files)
}

function handleToggleSelect(id: string) {
  toggleSelect(id)
}

function handleRemove(id: string) {
  removeImage(id)
}

function handlePreview(image: ImageItem) {
  previewImage.value = image
}

function handleClosePreview() {
  previewImage.value = null
}

async function handleProcess() {
  await processSelectedImages(processOptions.value)
}

async function handleDownload() {
  await downloadAsZip(completedImages.value, processOptions.value)
}

function handleClear() {
  clearAll()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <ImageIcon class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-800">图片批处理工具</h1>
            <p class="text-sm text-gray-500">基于浏览器的图片批量处理解决方案</p>
          </div>
          <div class="ml-auto flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
            <Sparkles class="w-4 h-4" />
            <span>纯前端处理，不上传服务器</span>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <ImageUploader @upload="handleUpload" />
          <ProcessSettings v-model="processOptions" />
        </div>

        <div class="lg:col-span-3 space-y-6">
          <ActionBar
            :selected-count="selectedImages.length"
            :total-count="images.length"
            :completed-count="completedImages.length"
            :is-processing="isProcessing"
            :is-downloading="isDownloading"
            :processing-progress="processingProgress"
            @select-all="selectAll"
            @deselect-all="deselectAll"
            @process="handleProcess"
            @download="handleDownload"
            @clear="handleClear"
          />
          <ImageList
            :images="images"
            @toggle-select="handleToggleSelect"
            @remove="handleRemove"
            @preview="handlePreview"
          />
        </div>
      </div>
    </main>

    <footer class="mt-auto py-6 text-center text-sm text-gray-400">
      <p>所有图片处理均在浏览器本地完成，数据不会上传到服务器</p>
    </footer>

    <ImagePreview
      :image="previewImage"
      @close="handleClosePreview"
    />
  </div>
</template>
