import { useRef, useState, useCallback } from 'react'
import {
  Upload,
  X,
  Play,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Layers,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import {
  loadImageToCanvas,
  invertImage,
  applyEdgeDetection,
  imageDataToDataUrl,
} from '@/hooks/useImageProcessor'

export default function BatchView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchItems = useAppStore((s) => s.batchItems)
  const selectedItemId = useAppStore((s) => s.selectedItemId)
  const direction = useAppStore((s) => s.direction)
  const intensity = useAppStore((s) => s.intensity)
  const edgeEnabled = useAppStore((s) => s.edgeEnabled)
  const edgeAlgorithm = useAppStore((s) => s.edgeAlgorithm)
  const edgeStrength = useAppStore((s) => s.edgeStrength)
  const addBatchItems = useAppStore((s) => s.addBatchItems)
  const removeBatchItem = useAppStore((s) => s.removeBatchItem)
  const clearBatchItems = useAppStore((s) => s.clearBatchItems)
  const updateBatchItem = useAppStore((s) => s.updateBatchItem)
  const setSelectedItemId = useAppStore((s) => s.setSelectedItemId)
  const setRecommendations = useAppStore((s) => s.setRecommendations)
  const setShowRecommendations = useAppStore((s) => s.setShowRecommendations)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      )
      if (imageFiles.length > 0) {
        addBatchItems(imageFiles)
      }
    },
    [addBatchItems]
  )

  const processItem = useCallback(
    async (id: string, originalImage: string) => {
      updateBatchItem(id, { status: 'processing' })
      try {
        const { imageData } = await loadImageToCanvas(originalImage)
        const inverted = invertImage(imageData, direction, intensity)
        const final_ = edgeEnabled
          ? applyEdgeDetection(inverted, edgeAlgorithm, edgeStrength)
          : inverted
        const dataUrl = imageDataToDataUrl(final_)

        const recRes = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: originalImage }),
        })
        let recs = []
        if (recRes.ok) {
          const data = await recRes.json()
          recs = data.recommendations || []
        }

        updateBatchItem(id, {
          processedImage: dataUrl,
          recommendations: recs,
          status: 'completed',
        })
      } catch (error) {
        updateBatchItem(id, {
          status: 'error',
          error: error instanceof Error ? error.message : '处理失败',
        })
      }
    },
    [updateBatchItem, direction, intensity, edgeEnabled, edgeAlgorithm, edgeStrength]
  )

  const processAll = useCallback(async () => {
    const pending = batchItems.filter((i) => i.status !== 'completed')
    for (const item of pending) {
      await processItem(item.id, item.originalImage)
    }
  }, [batchItems, processItem])

  const selectItem = useCallback(
    (item: any) => {
      setSelectedItemId(item.id)
      if (item.recommendations?.length) {
        setRecommendations(item.recommendations)
        setShowRecommendations(true)
      }
    },
    [setSelectedItemId, setRecommendations, setShowRecommendations]
  )

  const exportSelected = useCallback(() => {
    const completed = batchItems.filter((i) => i.status === 'completed')
    completed.forEach((item, index) => {
      if (item.processedImage) {
        setTimeout(() => {
          const link = document.createElement('a')
          link.download = `wadang-${index + 1}-${item.id}.png`
          link.href = item.processedImage
          link.click()
        }, index * 300)
      }
    })
  }, [batchItems])

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-paper/40" />,
    processing: <Loader2 className="w-4 h-4 text-gold animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  }

  const selectedItem = batchItems.find((i) => i.id === selectedItemId)

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-80 shrink-0 border-r border-gold/15 flex flex-col bg-ink-dark/30">
        <div className="p-4 border-b border-gold/10">
          <div
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? 'border-gold bg-gold/10'
                : 'border-gold/25 hover:border-gold/40 hover:bg-gold/5'
              }
            `}
            onDragEnter={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gold/60" />
            <p className="text-xs text-paper/60">拖拽或点击上传</p>
            <p className="text-[10px] text-paper/30 mt-1">支持多文件</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {batchItems.length > 0 && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={processAll}
                disabled={batchItems.every((i) => i.status === 'completed')}
                className="flex-1 px-3 py-2 rounded-lg bg-gold/20 text-gold text-xs
                           hover:bg-gold/30 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                全部处理
              </button>
              <button
                onClick={exportSelected}
                disabled={batchItems.filter((i) => i.status === 'completed').length === 0}
                className="px-3 py-2 rounded-lg bg-ink-light/50 text-paper/70 text-xs
                           hover:bg-ink-light/70 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearBatchItems}
                className="px-3 py-2 rounded-lg bg-ink-light/50 text-paper/50
                           hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {batchItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-paper/25">
              <ImageIcon className="w-10 h-10 mb-3" />
              <p className="text-xs">暂无图像</p>
            </div>
          )}

          {batchItems.map((item) => (
            <div
              key={item.id}
              onClick={() => selectItem(item)}
              className={`
                group relative rounded-lg overflow-hidden cursor-pointer
                border-2 transition-all
                ${selectedItemId === item.id
                  ? 'border-gold'
                  : 'border-transparent hover:border-gold/40'
                }
              `}
            >
              <div className="aspect-square bg-ink-light/30">
                <img
                  src={item.processedImage || item.originalImage}
                  alt=""
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="absolute top-1.5 right-1.5">{statusIcons[item.status]}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeBatchItem(item.id)
                }}
                className="absolute top-1.5 left-1.5 p-1 rounded-md bg-ink/60
                           text-paper/40 hover:text-paper/70 opacity-0
                           group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedItem ? (
          <div className="h-full flex flex-col items-center justify-center text-paper/25">
            <Layers className="w-16 h-16 mb-4" />
            <p className="text-sm">选择一个图像进行预览</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs text-gold/50 tracking-wider">原图</h4>
                <div className="aspect-square rounded-xl overflow-hidden bg-ink-light/30 border border-gold/15">
                  <img
                    src={selectedItem.originalImage}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs text-gold/50 tracking-wider">反转后</h4>
                <div className="aspect-square rounded-xl overflow-hidden bg-ink-light/30 border border-gold/15">
                  {selectedItem.processedImage ? (
                    <img
                      src={selectedItem.processedImage}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-paper/25">
                      {selectedItem.status === 'pending' && '等待处理'}
                      {selectedItem.status === 'processing' && (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      )}
                      {selectedItem.status === 'error' && '处理失败'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedItem.recommendations?.length > 0 && (
              <div className="mt-6 p-4 rounded-xl border border-gold/15 bg-ink-light/20">
                <h4 className="text-xs text-gold/50 tracking-wider mb-3">纹饰推荐</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.recommendations
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 4)
                    .map((rec, idx) => (
                      <div
                        key={rec.patternId}
                        className="px-3 py-2 rounded-lg bg-ink/40 border border-gold/15"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="text-sm text-paper/80">{rec.subtype}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gold/50">{rec.era}</span>
                          <span className="text-[10px] text-gold/60">
                            {(rec.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
