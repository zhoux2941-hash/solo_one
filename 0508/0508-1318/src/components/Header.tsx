import { Layers, ImageIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function Header() {
  const currentView = useAppStore((s) => s.currentView)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  return (
    <header className="shrink-0 border-b border-gold/20 bg-ink-dark/50 backdrop-blur-sm z-20">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center border border-gold/25">
            <Layers className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="font-serif text-base text-paper/90 tracking-wider">
              汉瓦·拓片反转
            </h1>
            <p className="text-[10px] text-gold/50 tracking-[0.3em] -mt-0.5">
              EAVE TILE RUBBING RESTORATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-ink/40 rounded-lg p-1 border border-gold/15">
          <button
            onClick={() => setCurrentView('single')}
            className={`
              px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all
              ${currentView === 'single'
                ? 'bg-gold/20 text-gold'
                : 'text-paper/50 hover:text-paper/70'
              }
            `}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>单图处理</span>
          </button>
          <button
            onClick={() => setCurrentView('batch')}
            className={`
              px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all
              ${currentView === 'batch'
                ? 'bg-gold/20 text-gold'
                : 'text-paper/50 hover:text-paper/70'
              }
            `}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>批量处理</span>
          </button>
        </div>
      </div>
    </header>
  )
}
