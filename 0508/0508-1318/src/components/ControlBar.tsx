import { Download, ArrowLeftRight, Wand2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { exportFullResolution } from '@/hooks/useImageProcessor'

export default function ControlBar() {
  const direction = useAppStore((s) => s.direction)
  const intensity = useAppStore((s) => s.intensity)
  const edgeAlgorithm = useAppStore((s) => s.edgeAlgorithm)
  const edgeStrength = useAppStore((s) => s.edgeStrength)
  const edgeEnabled = useAppStore((s) => s.edgeEnabled)
  const processedImage = useAppStore((s) => s.processedImage)
  const setDirection = useAppStore((s) => s.setDirection)
  const setIntensity = useAppStore((s) => s.setIntensity)
  const setEdgeAlgorithm = useAppStore((s) => s.setEdgeAlgorithm)
  const setEdgeStrength = useAppStore((s) => s.setEdgeStrength)
  const setEdgeEnabled = useAppStore((s) => s.setEdgeEnabled)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-ink-dark/95 backdrop-blur-sm border-t border-gold/20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="flex items-center gap-6 px-6 py-3 overflow-x-auto">
        <button
          onClick={() => setDirection(direction === 'yang2yin' ? 'yin2yang' : 'yang2yin')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/50 transition-all whitespace-nowrap"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-sm font-serif">
            {direction === 'yang2yin' ? '阳纹→阴纹' : '阴纹→阳纹'}
          </span>
        </button>

        <div className="flex items-center gap-2 min-w-[180px]">
          <label className="text-xs text-paper/50 whitespace-nowrap">反转强度</label>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gold/70 w-8 text-right">{intensity}</span>
        </div>

        <div className="w-px h-8 bg-gold/15" />

        <button
          onClick={() => setEdgeEnabled(!edgeEnabled)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
            edgeEnabled
              ? 'border-gold/50 bg-gold/15 text-gold'
              : 'border-gold/15 bg-transparent text-paper/40 hover:text-paper/60 hover:border-gold/30'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-sm">边缘增强</span>
        </button>

        {edgeEnabled && (
          <>
            <select
              value={edgeAlgorithm}
              onChange={(e) => setEdgeAlgorithm(e.target.value as 'sobel' | 'laplacian')}
              className="px-3 py-1.5 rounded-lg bg-ink-light border border-gold/20 text-sm text-paper/70 focus:outline-none focus:border-gold/50"
            >
              <option value="sobel">Sobel</option>
              <option value="laplacian">Laplacian</option>
            </select>

            <div className="flex items-center gap-2 min-w-[160px]">
              <label className="text-xs text-paper/50 whitespace-nowrap">强度</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edgeStrength}
                onChange={(e) => setEdgeStrength(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gold/70 w-8 text-right">{edgeStrength}</span>
            </div>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={() => processedImage && exportFullResolution(processedImage)}
          disabled={!processedImage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">导出 PNG</span>
        </button>
      </div>
    </div>
  )
}
