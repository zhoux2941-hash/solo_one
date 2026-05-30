import { useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { loadImageToCanvas, invertImage, applyEdgeDetection, imageDataToDataUrl } from '@/hooks/useImageProcessor'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import DualView from '@/components/DualView'
import ControlBar from '@/components/ControlBar'
import RecommendationPanel from '@/components/RecommendationPanel'
import BatchView from '@/components/BatchView'

export default function Home() {
  const currentView = useAppStore((s) => s.currentView)
  const originalImage = useAppStore((s) => s.originalImage)
  const processedImage = useAppStore((s) => s.processedImage)
  const direction = useAppStore((s) => s.direction)
  const intensity = useAppStore((s) => s.intensity)
  const edgeAlgorithm = useAppStore((s) => s.edgeAlgorithm)
  const edgeStrength = useAppStore((s) => s.edgeStrength)
  const edgeEnabled = useAppStore((s) => s.edgeEnabled)
  const isProcessing = useAppStore((s) => s.isProcessing)
  const setProcessedImage = useAppStore((s) => s.setProcessedImage)
  const setIsProcessing = useAppStore((s) => s.setIsProcessing)
  const setRecommendations = useAppStore((s) => s.setRecommendations)
  const setShowRecommendations = useAppStore((s) => s.setShowRecommendations)
  const reset = useAppStore((s) => s.reset)

  const processImage = useCallback(async () => {
    if (!originalImage) return
    setIsProcessing(true)
    try {
      const { imageData } = await loadImageToCanvas(originalImage)
      const inverted = invertImage(imageData, direction, intensity)
      const final_ = edgeEnabled
        ? applyEdgeDetection(inverted, edgeAlgorithm, edgeStrength)
        : inverted
      const dataUrl = imageDataToDataUrl(final_)
      setProcessedImage(dataUrl)
    } catch {
      setIsProcessing(false)
    }
  }, [originalImage, direction, intensity, edgeEnabled, edgeAlgorithm, edgeStrength, setProcessedImage, setIsProcessing])

  const fetchRecommendations = useCallback(async () => {
    if (!originalImage) return
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: originalImage }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.recommendations) {
          setRecommendations(data.recommendations)
          setShowRecommendations(true)
        }
      }
    } catch {
      // silently fail for recommendations
    }
  }, [originalImage, setRecommendations, setShowRecommendations])

  useEffect(() => {
    if (originalImage && currentView === 'single') {
      processImage().finally(() => setIsProcessing(false))
    }
  }, [originalImage, direction, intensity, edgeEnabled, edgeAlgorithm, edgeStrength, currentView])

  useEffect(() => {
    if (originalImage && currentView === 'single') {
      fetchRecommendations()
    }
  }, [originalImage, currentView])

  useEffect(() => {
    return () => reset()
  }, [])

  return (
    <div className="rice-paper-bg h-screen flex flex-col overflow-hidden">
      <Header />

      {currentView === 'single' ? (
        <>
          <main className="flex-1 flex relative overflow-hidden">
            {isProcessing && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                  <span className="text-sm text-paper/60">处理中...</span>
                </div>
              </div>
            )}

            {originalImage ? <DualView /> : <ImageUpload />}
          </main>

          {originalImage && <ControlBar />}
        </>
      ) : (
        <main className="flex-1 overflow-hidden">
          <BatchView />
        </main>
      )}

      <RecommendationPanel />
    </div>
  )
}
