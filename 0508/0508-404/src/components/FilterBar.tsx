import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import type { FacilityType } from '@/data/types'
import { FACILITY_LABELS, FACILITY_ICONS, FACILITY_COLORS } from '@/data/types'
import { Fuel, Zap, UtensilsCrossed, Bath, Baby, Wrench, X } from 'lucide-react'
import type { ReactNode } from 'react'

const iconMap: Record<FacilityType, ReactNode> = {
  gas_station: <Fuel size={16} />,
  charging: <Zap size={16} />,
  restaurant: <UtensilsCrossed size={16} />,
  restroom: <Bath size={16} />,
  nursery: <Baby size={16} />,
  auto_repair: <Wrench size={16} />,
}

const facilityTypes: FacilityType[] = [
  'gas_station',
  'charging',
  'restaurant',
  'restroom',
  'nursery',
  'auto_repair',
]

export default function FilterBar() {
  const { activeFilters, toggleFilter, clearFilters } = useStore()

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0a2e3a]/80 backdrop-blur-sm rounded-xl">
      {facilityTypes.map((type) => {
        const isActive = activeFilters.includes(type)
        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter(type)}
            className="rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
            style={
              isActive
                ? { backgroundColor: FACILITY_COLORS[type], color: '#fff' }
                : { backgroundColor: 'transparent', border: '2px solid #6B7280', color: '#6B7280' }
            }
          >
            {iconMap[type]}
            {FACILITY_LABELS[type]}
          </motion.button>
        )
      })}
      {activeFilters.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 bg-white/10 text-white"
        >
          <X size={16} />
          清除筛选
        </motion.button>
      )}
    </div>
  )
}
