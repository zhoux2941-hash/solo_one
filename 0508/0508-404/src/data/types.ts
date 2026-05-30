export type FacilityType = 'gas_station' | 'charging' | 'restaurant' | 'restroom' | 'nursery' | 'auto_repair'

export interface Highway {
  id: string
  name: string
  code: string
  color: string
  path: string
  totalLength: number
  startCity: string
  endCity: string
}

export interface ServiceArea {
  id: string
  name: string
  highwayId: string
  distance: number
  svgX: number
  svgY: number
  facilities: Facility[]
}

export interface Facility {
  type: FacilityType
  available: boolean
}

export interface Favorite {
  serviceAreaId: string
  createdAt: number
}

export const FACILITY_LABELS: Record<FacilityType, string> = {
  gas_station: '加油站',
  charging: '充电桩',
  restaurant: '餐厅',
  restroom: '卫生间',
  nursery: '母婴室',
  auto_repair: '汽修点',
}

export const FACILITY_ICONS: Record<FacilityType, string> = {
  gas_station: '⛽',
  charging: '🔌',
  restaurant: '🍽️',
  restroom: '🚻',
  nursery: '🧸',
  auto_repair: '🔧',
}

export const FACILITY_COLORS: Record<FacilityType, string> = {
  gas_station: '#E36414',
  charging: '#22C55E',
  restaurant: '#F59E0B',
  restroom: '#6B7280',
  nursery: '#EC4899',
  auto_repair: '#3B82F6',
}
