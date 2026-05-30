import { NavLink } from 'react-router-dom'
import { Scale, ArrowLeftRight, Box, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  onToggleFavorites: () => void
  favoritesCount: number
}

const navLinks = [
  { to: '/', label: '对照表', icon: Scale },
  { to: '/convert', label: '单位换算', icon: ArrowLeftRight },
  { to: '/artifact', label: '器物推定', icon: Box },
]

export default function Navigation({ onToggleFavorites, favoritesCount }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/80 backdrop-blur-md border-b border-parchment/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-cinnabar text-lg">◆</span>
          <h1 className="font-title text-2xl text-parchment tracking-widest">度量衡</h1>
          <span className="text-cinnabar text-lg">◆</span>
        </div>

        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-4 py-2 font-body text-sm transition-all duration-200 border-b-2',
                  isActive
                    ? 'text-parchment border-cinnabar'
                    : 'text-parchment/60 border-transparent hover:text-parchment hover:border-parchment/30'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <button
          onClick={onToggleFavorites}
          className="relative flex items-center gap-1.5 px-3 py-2 font-body text-sm text-parchment/60 hover:text-parchment border border-parchment/20 rounded-lg hover:border-parchment/40 transition-all duration-200 active:scale-[0.97]"
        >
          <Bookmark className="w-4 h-4" />
          <span>收藏</span>
          {favoritesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-cinnabar text-parchment text-xs rounded-full px-1 font-body">
              {favoritesCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
