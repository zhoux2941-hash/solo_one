import { create } from 'zustand'
import type { Stock } from '../types'

interface WebSocketState {
  connected: boolean
  lastUpdate: number
  stockPrices: Record<string, Stock>

  setConnected: (connected: boolean) => void
  setLastUpdate: (timestamp: number) => void
  updateStockPrice: (stock: Stock) => void
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  connected: false,
  lastUpdate: 0,
  stockPrices: {},

  setConnected: (connected) => set({ connected }),
  setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
  updateStockPrice: (stock) => set((state) => ({
    stockPrices: { ...state.stockPrices, [stock.code]: stock },
    lastUpdate: Date.now()
  }))
}))
