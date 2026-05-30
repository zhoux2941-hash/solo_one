import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import AddCityModal from './AddCityModal'

interface CitySelectorProps {
  onChange: (cityId: number) => void
}

export default function CitySelector({ onChange }: CitySelectorProps) {
  const cities = useDrumTowerStore((s) => s.cities)
  const selectedCity = useDrumTowerStore((s) => s.selectedCity)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedCity?.id || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-1.5 rounded border text-xs outline-none transition-all duration-200"
        style={{
          borderColor: '#8B7355',
          color: '#C5A55A',
          backgroundColor: 'rgba(26,26,46,0.9)',
          fontFamily: '"Noto Serif SC", serif',
          cursor: 'pointer',
        }}
      >
        {(cities || []).map((city) => (
          <option key={city.id} value={city.id} style={{ backgroundColor: '#1A1A2E', color: '#C5A55A' }}>
            {city.name} · {city.dynasty}
          </option>
        ))}
      </select>
      {selectedCity?.latitude && selectedCity?.longitude && (
        <span className="text-xs" style={{ color: '#6B7B8D' }}>
          {selectedCity.latitude.toFixed(2)}°N, {selectedCity.longitude.toFixed(2)}°E
        </span>
      )}
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded border transition-all duration-200"
        style={{
          borderColor: '#DAA520',
          color: '#DAA520',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(218,165,32,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title="添加城市"
      >
        <Plus size={14} />
      </button>
      <AddCityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        cities={cities || []}
      />
    </div>
  )
}
