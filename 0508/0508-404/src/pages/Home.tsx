import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, MapPin } from 'lucide-react'
import HighwayMap from '@/components/HighwayMap'
import FilterBar from '@/components/FilterBar'
import DetailPanel from '@/components/DetailPanel'
import SearchPanel from '@/components/SearchPanel'
import FavoritesPanel from '@/components/FavoritesPanel'
import { useStore } from '@/store/useStore'
import { highways } from '@/data/highways'

export default function Home() {
  const { showSearch, setShowSearch, showFavorites, setShowFavorites, selectedServiceAreaId } = useStore()

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a2e3a] text-white overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 bg-[#0a2e3a] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E36414] to-[#F59E0B] flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold tracking-wide">中国高速公路服务区查询</h1>
            <p className="text-xs text-white/40 font-mono">HIGHWAY SERVICE AREA FINDER</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-4">
            {highways.map(hw => (
              <div key={hw.id} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hw.color }} />
                <span className="text-xs text-white/60 font-mono">{hw.code}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowSearch(!showSearch); setShowFavorites(false) }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              showSearch ? 'bg-[#E36414] text-white' : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
          >
            <Search size={16} />
            搜索高速
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowFavorites(!showFavorites); setShowSearch(false) }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFavorites ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
          >
            <Heart size={16} />
            我的收藏
          </motion.button>
        </div>
      </header>

      <div className="flex items-center gap-3 px-6 py-2 shrink-0">
        <span className="text-xs text-white/40">设施筛选</span>
        <FilterBar />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <HighwayMap />

          <SearchPanel />
          <FavoritesPanel />
        </div>

        <AnimatePresence mode="wait">
          {selectedServiceAreaId && <DetailPanel />}
        </AnimatePresence>
      </div>
    </div>
  )
}
