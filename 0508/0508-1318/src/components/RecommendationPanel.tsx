import { BookOpen, X, Landmark, CircleDot } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function RecommendationPanel() {
  const showRecommendations = useAppStore((s) => s.showRecommendations)
  const setShowRecommendations = useAppStore((s) => s.setShowRecommendations)
  const recommendations = useAppStore((s) => s.recommendations)

  const sorted = [...recommendations].sort((a, b) => b.confidence - a.confidence)

  const categoryIcons: Record<string, string> = {
    '云纹': '☁',
    '文字瓦当': '文',
    '四神纹': '灵',
    '葵纹': '✿',
    '动物纹': '兽',
    '几何纹': '◇',
  }

  return (
    <>
      <button
        onClick={() => setShowRecommendations(!showRecommendations)}
        className={`
          fixed right-0 top-1/2 -translate-y-1/2 z-40
          px-2 py-4 rounded-l-lg border border-r-0
          transition-all duration-300
          ${showRecommendations
            ? 'border-gold/30 bg-ink-dark text-gold'
            : 'border-gold/20 bg-ink-dark/80 text-gold/60 hover:text-gold hover:border-gold/40'
          }
        `}
        style={{ right: showRecommendations ? '360px' : '0' }}
      >
        <BookOpen className="w-4 h-4" />
      </button>

      <div
        className={`
          fixed right-0 top-0 bottom-0 w-[360px] z-30
          bg-ink-dark/95 backdrop-blur-sm border-l border-gold/20
          ${showRecommendations ? 'panel-enter' : 'panel-exit hidden'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gold/15">
          <h3 className="font-serif text-sm text-gold tracking-wider">纹饰识别推荐</h3>
          <button
            onClick={() => setShowRecommendations(false)}
            className="text-paper/40 hover:text-paper/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-56px)] p-4 space-y-3">
          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-paper/30">
              <Landmark className="w-10 h-10 mb-3" />
              <p className="text-sm">上传图像后查看推荐结果</p>
            </div>
          )}

          {sorted.map((rec, idx) => (
            <div
              key={rec.patternId}
              className="fade-in rounded-xl border border-gold/15 bg-ink-light/40 p-4 hover:border-gold/30 transition-colors"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                  {categoryIcons[rec.categoryType] || <CircleDot className="w-4 h-4 text-gold/70" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif text-paper/90">{rec.subtype}</span>
                    <span className="text-xs text-gold/60">{rec.era}</span>
                  </div>
                  <p className="text-xs text-gold/40 mt-0.5">{rec.categoryType}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-ink/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-500"
                        style={{ width: `${rec.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gold/70 w-10 text-right">
                      {(rec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-xs text-paper/50 mt-2 leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.matchedFeatures.map((feat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] rounded-full border border-gold/15 text-gold/50 bg-gold/5"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
