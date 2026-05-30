interface ProcessOptions {
  format: 'original' | 'png' | 'jpg' | 'webp'
  quality: number
  resizeMode: 'none' | 'pixel' | 'percentage'
  width: number | null
  height: number | null
  maintainRatio: boolean
}

interface ProcessMessage {
  type: 'process'
  id: string
  dataUrl: string
  options: ProcessOptions
}

interface ResultMessage {
  type: 'result'
  id: string
  success: boolean
  dataUrl?: string
  size?: number
  error?: string
}

function formatToMimeType(format: string): string {
  switch (format) {
    case 'png':
      return 'image/png'
    case 'jpg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

async function processImage(
  img: HTMLImageElement,
  options: ProcessOptions
): Promise<{ dataUrl: string; size: number }> {
  const canvas = new OffscreenCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')!

  let { width, height } = img

  if (options.resizeMode !== 'none' && (options.width || options.height)) {
    if (options.resizeMode === 'pixel') {
      const newWidth = options.width || width
      const newHeight = options.height || height

      if (options.maintainRatio) {
        const ratio = Math.min(newWidth / width, newHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      } else {
        width = newWidth
        height = newHeight
      }
    } else {
      const scale = (options.width || 100) / 100
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
  }

  canvas.width = width
  canvas.height = height

  ctx.drawImage(img, 0, 0, width, height)

  const mimeType = options.format === 'original'
    ? 'image/png'
    : formatToMimeType(options.format)
  const quality = options.quality / 100

  return new Promise((resolve, reject) => {
    canvas.convertToBlob({ type: mimeType, quality })
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            size: blob.size
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const { type, id, dataUrl, options } = e.data

  if (type === 'process') {
    try {
      const img = await loadImage(dataUrl)
      const result = await processImage(img, options)
      
      const message: ResultMessage = {
        type: 'result',
        id,
        success: true,
        dataUrl: result.dataUrl,
        size: result.size
      }
      self.postMessage(message)
    } catch (err) {
      const message: ResultMessage = {
        type: 'result',
        id,
        success: false,
        error: err instanceof Error ? err.message : '处理失败'
      }
      self.postMessage(message)
    }
  }
}
