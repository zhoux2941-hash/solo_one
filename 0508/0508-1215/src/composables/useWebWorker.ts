import { ref } from 'vue'
import type { ProcessOptions } from '@/types'

interface WorkerResult {
  id: string
  success: boolean
  dataUrl?: string
  size?: number
  error?: string
}

export function useWebWorker() {
  const worker = ref<Worker | null>(null)
  const isInitialized = ref(false)
  const pendingPromises = ref<Map<string, { resolve: (result: WorkerResult) => void; reject: (error: string) => void }>>(new Map())

  function initWorker() {
    if (worker.value) return

    worker.value = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url))
    
    worker.value.onmessage = (e: MessageEvent<WorkerResult>) => {
      const { id, success, dataUrl, size, error } = e.data
      const promise = pendingPromises.value.get(id)
      
      if (promise) {
        pendingPromises.value.delete(id)
        if (success) {
          promise.resolve({ id, success, dataUrl, size })
        } else {
          promise.reject(error || '处理失败')
        }
      }
    }

    worker.value.onerror = (e) => {
      console.error('Worker error:', e)
      pendingPromises.value.forEach((promise, id) => {
        promise.reject('Worker error')
      })
      pendingPromises.value.clear()
    }

    isInitialized.value = true
  }

  function terminateWorker() {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
      isInitialized.value = false
    }
    pendingPromises.value.clear()
  }

  async function processImage(id: string, dataUrl: string, options: ProcessOptions): Promise<WorkerResult> {
    if (!worker.value) {
      initWorker()
    }

    return new Promise((resolve, reject) => {
      pendingPromises.value.set(id, { resolve, reject })
      
      worker.value?.postMessage({
        type: 'process',
        id,
        dataUrl,
        options: {
          format: options.format,
          quality: options.quality,
          resizeMode: options.resizeMode,
          width: options.width,
          height: options.height,
          maintainRatio: options.maintainRatio
        }
      })
    })
  }

  return {
    isInitialized,
    initWorker,
    terminateWorker,
    processImage
  }
}
