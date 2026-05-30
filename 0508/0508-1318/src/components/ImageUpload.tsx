import { useCallback, useState } from 'react'
import { Paintbrush } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function ImageUpload() {
  const setOriginalImage = useAppStore((s) => s.setOriginalImage)
  const setIsProcessing = useAppStore((s) => s.setIsProcessing)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(png|jpeg|bmp|webp)$/)) return
      setIsProcessing(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setOriginalImage(dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [setOriginalImage, setIsProcessing]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-4
          w-full max-w-lg aspect-square
          border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300 ease-out
          ${isDragOver
            ? 'border-gold bg-gold/10 scale-[1.02]'
            : 'border-gold/30 bg-ink-light/30 hover:border-gold/60 hover:bg-gold/5'
          }
        `}
      >
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.bmp,.webp"
          onChange={handleChange}
          className="hidden"
        />
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isDragOver
              ? 'bg-gold/20 text-gold scale-110'
              : 'bg-gold/10 text-gold/60'
            }
          `}
        >
          <Paintbrush className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className={`font-serif text-lg transition-colors ${isDragOver ? 'text-gold' : 'text-paper/80'}`}>
            拖放拓片图像至此
          </p>
          <p className="text-sm text-paper/40 mt-1">
            或点击选择文件 · 支持 PNG / JPG / BMP / WebP
          </p>
        </div>
        <div className="absolute inset-4 border border-gold/10 rounded-xl pointer-events-none" />
      </label>
    </div>
  )
}
