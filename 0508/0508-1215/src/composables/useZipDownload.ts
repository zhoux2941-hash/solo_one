import { ref } from 'vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ImageItem, ProcessOptions } from '@/types'
import { generateFilename } from '@/utils/fileUtils'
import { formatToExtension } from '@/utils/imageUtils'

export function useZipDownload() {
  const isDownloading = ref(false)

  async function downloadAsZip(
    images: ImageItem[],
    options: ProcessOptions
  ): Promise<void> {
    if (images.length === 0) return

    isDownloading.value = true
    const zip = new JSZip()

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (img.status !== 'completed' || !img.processedUrl) continue

      const sequence = options.sequenceStart + i
      const name = generateFilename(
        img.file.name,
        options.renameTemplate || '{{name}}_{{seq}}',
        sequence,
        options.sequencePadding
      )
      
      const nameWithoutExt = name.replace(/\.[^/.]+$/, '')
      const ext = options.format === 'original' 
        ? img.file.name.split('.').pop() 
        : formatToExtension(options.format).slice(1)
      const filename = `${nameWithoutExt}.${ext}`

      const response = await fetch(img.processedUrl)
      const blob = await response.blob()
      zip.file(filename, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, 'processed_images.zip')

    isDownloading.value = false
  }

  return {
    isDownloading,
    downloadAsZip
  }
}
