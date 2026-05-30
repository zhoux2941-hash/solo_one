import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { highways } from '@/data/highways'
import { serviceAreas } from '@/data/serviceAreas'
import { FACILITY_ICONS } from '@/data/types'
import { Search, X, MapPin, ChevronRight, Navigation } from 'lucide-react'

export default function SearchPanel() {
  const { searchQuery, setSearchQuery, showSearch, setShowSearch, setSelectedServiceAreaId, setSelectedHighwayId } = useStore()

  const q = searchQuery.toLowerCase()
  const matchedHighways = q
    ? highways.filter(h => h.code.toLowerCase().includes(q) || h.name.toLowerCase().includes(q))
    : []

  return (
    <AnimatePresence>
      {showSearch && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          className="absolute bottom-4 left-4 w-[420px] max-h-[60vh] bg-[#0a2e3a]/95 backdrop-blur-md rounded-2xl text-white overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <Search size={18} className="text-white/50 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="输入高速名称搜索..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40"
            />
            <button onClick={() => { setSearchQuery(''); setShowSearch(false) }} className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(60vh-52px)]">
            {matchedHighways.length === 0 && q && (
              <div className="px-4 py-8 text-center text-white/40 text-sm">未找到匹配的高速公路</div>
            )}

            {matchedHighways.map(highway => {
              const areas = serviceAreas
                .filter(sa => sa.highwayId === highway.id)
                .sort((a, b) => a.distance - b.distance)

              return (
                <div key={highway.id} className="border-b border-white/5 last:border-b-0">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: highway.color }}
                    />
                    <span className="text-sm font-semibold">{highway.code}</span>
                    <span className="text-sm">{highway.name}</span>
                    <span className="text-xs text-white/40 ml-auto">
                      {highway.totalLength}km
                    </span>
                    <Navigation size={12} className="text-white/30" />
                    <span className="text-xs text-white/50">
                      {highway.startCity}→{highway.endCity}
                    </span>
                  </div>

                  {areas.map(sa => (
                    <button
                      key={sa.id}
                      onClick={() => {
                        setSelectedServiceAreaId(sa.id)
                        setSelectedHighwayId(sa.highwayId)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <MapPin size={14} className="text-white/40 shrink-0" />
                      <span className="text-sm flex-1">{sa.name}</span>
                      <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                        距{highway.startCity} {sa.distance}km
                      </span>
                      <div className="flex gap-0.5">
                        {sa.facilities.map(f => (
                          <span key={f.type} className="text-xs">{FACILITY_ICONS[f.type]}</span>
                        ))}
                      </div>
                      <ChevronRight size={14} className="text-white/20 shrink-0" />
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
