export interface ImageItem {
  id: string
  file: File
  originalUrl: string
  processedUrl: string | null
  originalSize: number
  processedSize: number | null
  selected: boolean
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface ProcessOptions {
  format: 'original' | 'png' | 'jpg' | 'webp'
  quality: number
  resizeMode: 'none' | 'pixel' | 'percentage'
  width: number | null
  height: number | null
  maintainRatio: boolean
  renameTemplate: string
  sequenceStart: number
  sequencePadding: number
}

export type FormatType = 'image/png' | 'image/jpeg' | 'image/webp'
