import { create } from 'zustand'
import type { ChariotType, HarnessType, HarnessPart, TerrainType, CalculationResult, HarnessPlacement } from '../../shared/types'

interface ChariotStore {
  chariotTypes: ChariotType[]
  harnessTypes: HarnessType[]
  harnessParts: HarnessPart[]
  terrainTypes: TerrainType[]
  selectedChariotType: string
  horseCount: number
  selectedHarnessType: string
  selectedTerrainType: string
  placements: HarnessPlacement[]
  calculationResult: CalculationResult | null
  showPdfModal: boolean
  fetchChariotTypes: () => Promise<void>
  fetchHarnessTypes: () => Promise<void>
  fetchHarnessParts: () => Promise<void>
  fetchTerrainTypes: () => Promise<void>
  setSelectedChariotType: (id: string) => void
  setHorseCount: (count: number) => void
  setSelectedHarnessType: (id: string) => void
  setSelectedTerrainType: (id: string) => void
  setPlacements: (placements: HarnessPlacement[]) => void
  calculate: () => Promise<void>
  setShowPdfModal: (show: boolean) => void
}

export const useChariotStore = create<ChariotStore>((set, get) => ({
  chariotTypes: [],
  harnessTypes: [],
  harnessParts: [],
  terrainTypes: [],
  selectedChariotType: 'light',
  horseCount: 2,
  selectedHarnessType: 'neckband',
  selectedTerrainType: 'flat',
  placements: [],
  calculationResult: null,
  showPdfModal: false,

  fetchChariotTypes: async () => {
    const res = await fetch('/api/chariot/chariot-types')
    const data = await res.json()
    set({ chariotTypes: data, selectedChariotType: 'light' })
  },

  fetchHarnessTypes: async () => {
    const res = await fetch('/api/chariot/harness-types')
    const data = await res.json()
    set({ harnessTypes: data, selectedHarnessType: 'neckband' })
  },

  fetchHarnessParts: async () => {
    const res = await fetch('/api/chariot/harness-parts')
    const data = await res.json()
    set({ harnessParts: data, horseCount: 2 })
  },

  fetchTerrainTypes: async () => {
    const res = await fetch('/api/chariot/terrain-types')
    const data = await res.json()
    set({ terrainTypes: data, selectedTerrainType: 'flat' })
  },

  setSelectedChariotType: (id) => set({ selectedChariotType: id }),
  setHorseCount: (count) => set({ horseCount: count }),
  setSelectedHarnessType: (id) => set({ selectedHarnessType: id }),
  setSelectedTerrainType: (id) => set({ selectedTerrainType: id }),
  setPlacements: (placements) => set({ placements }),

  calculate: async () => {
    const { selectedChariotType, horseCount, selectedHarnessType, selectedTerrainType, placements } = get()
    const res = await fetch('/api/chariot/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chariotType: selectedChariotType,
        horseCount,
        harnessType: selectedHarnessType,
        terrainType: selectedTerrainType,
        placements,
      }),
    })
    const data = await res.json()
    set({ calculationResult: data })
  },

  setShowPdfModal: (show) => set({ showPdfModal: show }),
}))
