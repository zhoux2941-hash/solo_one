import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { serviceAreas } from '@/data/serviceAreas'
import { highways } from '@/data/highways'
import { FACILITY_ICONS } from '@/data/types'
import { Heart, X, MapPin, Navigation, Trash2 } from 'lucide-react'

export default function FavoritesPanel() {
  const { showFavorites, setShowFavorites, favorites, setSelectedServiceAreaId, toggleFavorite } = useStore()

  const sorted = [...favorites].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <AnimatePresence>
      {showFavorites && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          className="absolute bottom-4 right-4 w-[360px] max-h-[60vh] bg-[#0a2e3a]/95 backdrop-blur-md rounded-2xl text-white overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              <span className="font-bold text-lg">我的收藏</span>
              {favorites.length > 0 && (
                <span className="bg-red-400/20 text-red-300 text-xs px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowFavorites(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(60vh - 60px)' }}>
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Heart className="w-10 h-10 mb-3" />
                <span className="text-sm">暂无收藏</span>
              </div>
            ) : (
              sorted.map((fav) => {
                const sa = serviceAreas.find((s) => s.id === fav.serviceAreaId)
                if (!sa) return null
                const hw = highways.find((h) => h.id === sa.highwayId)
                const availableFacilities = sa.facilities.filter((f) => f.available)

                return (
                  <div key={fav.serviceAreaId} className="bg-white/10 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{sa.name}</span>
                      {hw && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: hw.color + '30', color: hw.color }}
                        >
                          {hw.code}
                        </span>
                      )}
                    </div>
                    {hw && (
                      <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
                        <Navigation className="w-3 h-3" />
                        <span>距{hw.startCity} {sa.distance}km</span>
                      </div>
                    )}
                    <div className="flex gap-1 mb-2">
                      {availableFacilities.map((f) => (
                        <span key={f.type} className="text-sm">{FACILITY_ICONS[f.type]}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedServiceAreaId(sa.id)
                          setShowFavorites(false)
                        }}
                        className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        定位
                      </button>
                      <button
                        onClick={() => toggleFavorite(sa.id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-400/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        取消收藏
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
