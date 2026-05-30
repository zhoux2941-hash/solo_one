import { create } from 'zustand'
import type { FacilityType, Favorite } from '@/data/types'
import { serviceAreas } from '@/data/serviceAreas'

interface AppState {
  selectedServiceAreaId: string | null
  activeFilters: FacilityType[]
  favorites: Favorite[]
  searchQuery: string
  showFavorites: boolean
  showSearch: boolean
  selectedHighwayId: string | null

  setSelectedServiceAreaId: (id: string | null) => void
  toggleFilter: (type: FacilityType) => void
  clearFilters: () => void
  toggleFavorite: (serviceAreaId: string) => void
  isFavorite: (serviceAreaId: string) => boolean
  setSearchQuery: (q: string) => void
  setShowFavorites: (v: boolean) => void
  setShowSearch: (v: boolean) => void
  setSelectedHighwayId: (id: string | null) => void

  getFilteredServiceAreaIds: () => string[]
}

const STORAGE_KEY = 'highway-favorites'

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveFavorites(favs: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

export const useStore = create<AppState>((set, get) => ({
  selectedServiceAreaId: null,
  activeFilters: [],
  favorites: loadFavorites(),
  searchQuery: '',
  showFavorites: false,
  showSearch: false,
  selectedHighwayId: null,

  setSelectedServiceAreaId: (id) => set({ selectedServiceAreaId: id }),

  toggleFilter: (type) =>
    set((s) => {
      const next = s.activeFilters.includes(type)
        ? s.activeFilters.filter((t) => t !== type)
        : [...s.activeFilters, type]
      return { activeFilters: next }
    }),

  clearFilters: () => set({ activeFilters: [] }),

  toggleFavorite: (serviceAreaId) =>
    set((s) => {
      const exists = s.favorites.find((f) => f.serviceAreaId === serviceAreaId)
      const next = exists
        ? s.favorites.filter((f) => f.serviceAreaId !== serviceAreaId)
        : [...s.favorites, { serviceAreaId, createdAt: Date.now() }]
      saveFavorites(next)
      return { favorites: next }
    }),

  isFavorite: (serviceAreaId) =>
    get().favorites.some((f) => f.serviceAreaId === serviceAreaId),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowFavorites: (v) => set({ showFavorites: v }),
  setShowSearch: (v) => set({ showSearch: v }),
  setSelectedHighwayId: (id) => set({ selectedHighwayId: id }),

  getFilteredServiceAreaIds: () => {
    const { activeFilters } = get()
    if (activeFilters.length === 0) return serviceAreas.map((s) => s.id)
    return serviceAreas
      .filter((sa) =>
        activeFilters.every((ft) =>
          sa.facilities.some((f) => f.type === ft && f.available)
        )
      )
      .map((s) => s.id)
  },
}))
