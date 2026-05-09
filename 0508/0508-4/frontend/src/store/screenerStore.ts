import { create } from 'zustand'
import type { 
  FilterCondition, 
  ScreenStrategy, 
  ScreenResult, 
  ScreenMeta 
} from '../types'

interface ScreenerState {
  strategies: ScreenStrategy[]
  currentConditions: FilterCondition[]
  selectedMarkets: string[]
  results: ScreenResult[]
  meta: ScreenMeta | null
  isModalOpen: boolean
  isResultsOpen: boolean
  loading: boolean
  error: string | null
  selectedStrategyId: number | null

  setStrategies: (strategies: ScreenStrategy[]) => void
  addStrategy: (strategy: ScreenStrategy) => void
  removeStrategy: (id: number) => void
  updateStrategy: (strategy: ScreenStrategy) => void
  
  setCurrentConditions: (conditions: FilterCondition[]) => void
  addCondition: (condition: FilterCondition) => void
  removeCondition: (index: number) => void
  updateCondition: (index: number, condition: FilterCondition) => void
  clearConditions: () => void
  
  setSelectedMarkets: (markets: string[]) => void
  
  setResults: (results: ScreenResult[]) => void
  clearResults: () => void
  
  setMeta: (meta: ScreenMeta) => void
  
  openModal: () => void
  closeModal: () => void
  
  openResults: () => void
  closeResults: () => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  setSelectedStrategyId: (id: number | null) => void
}

export const useScreenerStore = create<ScreenerState>((set) => ({
  strategies: [],
  currentConditions: [],
  selectedMarkets: ['sh', 'sz'],
  results: [],
  meta: null,
  isModalOpen: false,
  isResultsOpen: false,
  loading: false,
  error: null,
  selectedStrategyId: null,

  setStrategies: (strategies) => set({ strategies }),
  addStrategy: (strategy) => set((state) => ({
    strategies: [strategy, ...state.strategies]
  })),
  removeStrategy: (id) => set((state) => ({
    strategies: state.strategies.filter(s => s.id !== id)
  })),
  updateStrategy: (strategy) => set((state) => ({
    strategies: state.strategies.map(s => s.id === strategy.id ? strategy : s)
  })),

  setCurrentConditions: (conditions) => set({ currentConditions: conditions }),
  addCondition: (condition) => set((state) => ({
    currentConditions: [...state.currentConditions, condition]
  })),
  removeCondition: (index) => set((state) => ({
    currentConditions: state.currentConditions.filter((_, i) => i !== index)
  })),
  updateCondition: (index, condition) => set((state) => ({
    currentConditions: state.currentConditions.map((c, i) => i === index ? condition : c)
  })),
  clearConditions: () => set({ currentConditions: [] }),

  setSelectedMarkets: (markets) => set({ selectedMarkets: markets }),

  setResults: (results) => set({ results }),
  clearResults: () => set({ results: [] }),

  setMeta: (meta) => set({ meta }),

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  openResults: () => set({ isResultsOpen: true }),
  closeResults: () => set({ isResultsOpen: false }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setSelectedStrategyId: (id) => set({ selectedStrategyId: id })
}))
