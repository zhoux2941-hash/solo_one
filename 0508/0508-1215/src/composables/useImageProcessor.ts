import { ref, computed, onUnmounted } from 'vue'
import type { ImageItem, ProcessOptions } from '@/types'
import { isValidImageFile } from '@/utils/fileUtils'
import { useWebWorker } from './useWebWorker'

export function useImageProcessor() {
  const images = ref<ImageItem[]>([])
  const isProcessing = ref(false)
  const processingProgress = ref(0)
  const completedCount = ref(0)

  const { initWorker, terminateWorker, processImage } = useWebWorker()

  onUnmounted(() => {
    terminateWorker()
  })

  const selectedImages = computed(() => images.value.filter(img => img.selected))
  const completedImages = computed(() => images.value.filter(img => img.status === 'completed'))

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function addImages(files: FileList | File[]) {
    const fileArray = Array.from(files)
    
    fileArray.forEach(file => {
      if (isValidImageFile(file)) {
        const id = generateId()
        const originalUrl = URL.createObjectURL(file)
        
        images.value.push({
          id,
          file,
          originalUrl,
          processedUrl: null,
          originalSize: file.size,
          processedSize: null,
          selected: true,
          status: 'pending'
        })
      }
    })
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const img = images.value[index]
      URL.revokeObjectURL(img.originalUrl)
      if (img.processedUrl) {
        URL.revokeObjectURL(img.processedUrl)
      }
      images.value.splice(index, 1)
    }
  }

  function clearAll() {
    images.value.forEach(img => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.processedUrl) {
        URL.revokeObjectURL(img.processedUrl)
      }
    })
    images.value = []
  }

  function toggleSelect(id: string) {
    const img = images.value.find(i => i.id === id)
    if (img) {
      img.selected = !img.selected
    }
  }

  function selectAll() {
    images.value.forEach(img => img.selected = true)
  }

  function deselectAll() {
    images.value.forEach(img => img.selected = false)
  }

  async function processSelectedImages(options: ProcessOptions) {
    const selected = [...selectedImages.value]
    if (selected.length === 0) return

    isProcessing.value = true
    processingProgress.value = 0
    completedCount.value = 0

    initWorker()

    const promises = selected.map((imgItem, index) => {
      imgItem.status = 'processing'
      imgItem.error = undefined

      return processImage(imgItem.id, imgItem.originalUrl, options)
        .then(result => {
          if (result.success && result.dataUrl) {
            if (imgItem.processedUrl) {
              URL.revokeObjectURL(imgItem.processedUrl)
            }
            imgItem.processedUrl = result.dataUrl
            imgItem.processedSize = result.size
            imgItem.status = 'completed'
          } else {
            imgItem.status = 'error'
            imgItem.error = result.error || '处理失败'
          }
        })
        .catch(error => {
          imgItem.status = 'error'
          imgItem.error = error instanceof Error ? error.message : '处理失败'
        })
        .finally(() => {
          completedCount.value++
          processingProgress.value = (completedCount.value / selected.length) * 100
        })
    })

    await Promise.all(promises)

    isProcessing.value = false
  }

  return {
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
  }
}
