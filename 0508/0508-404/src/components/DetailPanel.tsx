import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { serviceAreas } from '@/data/serviceAreas'
import { highways } from '@/data/highways'
import { FACILITY_LABELS, FACILITY_ICONS, FACILITY_COLORS } from '@/data/types'
import type { FacilityType } from '@/data/types'
import { X, Heart, MapPin, Navigation } from 'lucide-react'

const ALL_FACILITY_TYPES: FacilityType[] = [
  'gas_station', 'charging', 'restaurant', 'restroom', 'nursery', 'auto_repair',
]

export default function DetailPanel() {
  const { selectedServiceAreaId, setSelectedServiceAreaId, toggleFavorite, isFavorite } = useStore()

  if (!selectedServiceAreaId) return null

  const sa = serviceAreas.find((s) => s.id === selectedServiceAreaId)
  if (!sa) return null

  const highway = highways.find((h) => h.id === sa.highwayId)

  const facilityMap = new Map(sa.facilities.map((f) => [f.type, f.available]))

  return (
    <AnimatePresence>
      <motion.div
        key={sa.id}
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-[380px] h-full bg-gradient-to-b from-[#0F4C5C] to-[#0a2e3a] text-white flex flex-col shadow-2xl overflow-y-auto"
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold leading-tight">{sa.name}</h2>
            {highway && (
              <span
                className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: highway.color + '33', color: highway.color }}
              >
                <MapPin className="inline w-3 h-3 mr-1" />
                {highway.name}
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedServiceAreaId(null)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 px-5 pb-4">
          {highway && (
            <span className="flex items-center gap-1 text-sm text-white/70">
              <Navigation className="w-3.5 h-3.5" />
              距{highway.startCity} {sa.distance}km
            </span>
          )}
          <button
            onClick={() => toggleFavorite(sa.id)}
            className="ml-auto flex items-center gap-1 text-sm hover:scale-105 transition-transform"
          >
            <Heart
              className="w-4 h-4"
              fill={isFavorite(sa.id) ? '#EF4444' : 'none'}
              stroke={isFavorite(sa.id) ? '#EF4444' : 'currentColor'}
            />
            {isFavorite(sa.id) ? '已收藏' : '收藏'}
          </button>
        </div>

        <div className="px-5 pb-5">
          <h3 className="text-sm font-semibold text-white/60 mb-3">设施信息</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {ALL_FACILITY_TYPES.map((type) => {
              const available = facilityMap.get(type) ?? false
              return (
                <div
                  key={type}
                  className={`rounded-xl p-3 ${
                    available
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/10 opacity-50'
                  }`}
                >
                  <span className="text-lg">{FACILITY_ICONS[type]}</span>
                  <p className="text-sm font-medium mt-1">{FACILITY_LABELS[type]}</p>
                  <p className={`text-xs mt-0.5 ${available ? 'text-green-400' : 'text-gray-400'}`}>
                    {available ? '可用' : '暂不可用'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
