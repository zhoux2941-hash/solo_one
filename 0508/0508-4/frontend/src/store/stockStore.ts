import { create } from 'zustand'
import type { Stock, KLineData, TimeLineData, KLineType, MovingAverage } from '../types'

interface StockState {
  selectedStock: Stock | null
  kLineData: KLineData[]
  timeLineData: TimeLineData[]
  kLineType: KLineType
  maTypes: MovingAverage[]
  showVolume: boolean
  searchResults: Stock[]
  loading: boolean
  error: string | null
  
  setSelectedStock: (stock: Stock | null) => void
  setKLineData: (data: KLineData[]) => void
  setTimeLineData: (data: TimeLineData[]) => void
  setKLineType: (type: KLineType) => void
  toggleMAType: (type: MovingAverage) => void
  setShowVolume: (show: boolean) => void
  setSearchResults: (results: Stock[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateStockPrice: (stock: Partial<Stock> & { code: string }) => void
}

export const useStockStore = create<StockState>((set) => ({
  selectedStock: null,
  kLineData: [],
  timeLineData: [],
  kLineType: 'day',
  maTypes: [5, 10],
  showVolume: true,
  searchResults: [],
  loading: false,
  error: null,

  setSelectedStock: (stock) => set({ selectedStock: stock }),
  setKLineData: (data) => set({ kLineData: data }),
  setTimeLineData: (data) => set({ timeLineData: data }),
  setKLineType: (type) => set({ kLineType: type }),
  toggleMAType: (type) => set((state) => ({
    maTypes: state.maTypes.includes(type)
      ? state.maTypes.filter(t => t !== type)
      : [...state.maTypes, type]
  })),
  setShowVolume: (show) => set({ showVolume: show }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateStockPrice: (stock) => set((state) => ({
    selectedStock: state.selectedStock?.code === stock.code
      ? { ...state.selectedStock, ...stock } as Stock
      : state.selectedStock
  }))
}))
