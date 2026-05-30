import type { FormatType, ProcessOptions } from '@/types'

export function formatToMimeType(format: string): FormatType {
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

export function formatToExtension(format: string): string {
  switch (format) {
    case 'png':
      return '.png'
    case 'jpg':
      return '.jpg'
    case 'webp':
      return '.webp'
    default:
      return '.png'
  }
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function processImage(
  img: HTMLImageElement,
  options: ProcessOptions
): Promise<Blob> {
  const canvas = document.createElement('canvas')
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
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to process image'))
        }
      },
      mimeType,
      quality
    )
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
