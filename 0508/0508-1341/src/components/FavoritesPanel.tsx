import { X, Trash2 } from 'lucide-react'
import type { FavoriteItem } from '@/types'
import type { ConversionResult, ArtifactEstimation } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('zh-CN')
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

function ConversionCard({ data }: { data: ConversionResult }) {
  const { input, modernValue, modernUnit, targets } = data
  return (
    <div className="space-y-2">
      <div className="font-title text-xl text-parchment">
        {input.dynasty} {formatNum(input.value)}{input.unit} = {formatNum(modernValue)}{modernUnit}
      </div>
      {targets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {targets.map((t, i) => (
            <span
              key={i}
              className="text-sm font-body text-parchment/70 bg-parchment/5 px-2 py-1 rounded"
            >
              {t.dynasty} {formatNum(t.value)}{t.unit}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactCard({ data }: { data: ArtifactEstimation }) {
  const { artifactName, adjustedDimensions, dynastyValues } = data
  const primaryDim = adjustedDimensions[0]
  const primaryDynasty = dynastyValues[0]
  const primaryDynastyDim = primaryDynasty?.dimensions[0]

  return (
    <div className="space-y-2">
      <div className="font-title text-xl text-parchment">
        {artifactName} · {primaryDim?.label}{formatNum(primaryDim?.value || 0)}{primaryDim?.unit} ≈{' '}
        {primaryDynasty?.dynasty}
        {formatNum(primaryDynastyDim?.chiValue || 0)}
        {primaryDynastyDim?.unit}
      </div>
      {dynastyValues.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {dynastyValues.slice(1).map((dv, i) => {
            const dim = dv.dimensions[0]
            return (
              <span
                key={i}
                className="text-sm font-body text-parchment/70 bg-parchment/5 px-2 py-1 rounded"
              >
                {dv.dynasty} {formatNum(dim?.chiValue || 0)}{dim?.unit}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  const isConversion = item.type === 'conversion'

  return (
    <div className="parchment-card p-4 relative group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                'text-xs font-body px-2 py-0.5 rounded',
                isConversion
                  ? 'bg-cinnabar/15 text-cinnabar border border-cinnabar/30'
                  : 'bg-bronze/15 text-bronze border border-bronze/30'
              )}
            >
              {isConversion ? '换算' : '推定'}
            </span>
            <span className="text-xs font-body text-parchment/40">
              {formatTimestamp(item.createdAt)}
            </span>
          </div>
          {isConversion ? (
            <ConversionCard data={item.data as ConversionResult} />
          ) : (
            <ArtifactCard data={item.data as ArtifactEstimation} />
          )}
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 p-2 rounded text-parchment/30 hover:text-cinnabar hover:bg-cinnabar/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="删除收藏"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function FavoritesPanel({ isOpen, onClose }: FavoritesPanelProps) {
  const { favorites, removeFavorite, clearFavorites } = useFavorites()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-ink z-50 shadow-2xl transition-transform duration-300 ease-out transform',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-parchment/10">
            <h2 className="font-title text-2xl text-parchment tracking-wider">收藏</h2>
            <div className="flex items-center gap-2">
              {favorites.length > 0 && (
                <button
                  onClick={clearFavorites}
                  className="text-sm font-body text-parchment/50 hover:text-cinnabar transition-colors px-3 py-1 rounded hover:bg-cinnabar/10"
                >
                  清空
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded text-parchment/50 hover:text-parchment hover:bg-parchment/10 transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4 opacity-20">📜</div>
                <p className="font-body text-parchment/40">暂无收藏</p>
                <p className="font-body text-parchment/30 text-sm mt-1">
                  点击换算结果旁的收藏按钮保存
                </p>
              </div>
            ) : (
              favorites.map((item) => (
                <FavoriteCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeFavorite(item.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
