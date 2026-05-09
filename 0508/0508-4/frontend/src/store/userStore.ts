import { create } from 'zustand'
import type { User, WatchlistGroup, PriceAlert } from '../types'

interface UserState {
  user: User | null
  isLoggedIn: boolean
  watchlist: WatchlistGroup[]
  priceAlerts: PriceAlert[]
  loginModalVisible: boolean
  registerModalVisible: boolean
  groupModalVisible: boolean
  alertModalVisible: boolean

  setUser: (user: User | null) => void
  setWatchlist: (watchlist: WatchlistGroup[]) => void
  setPriceAlerts: (alerts: PriceAlert[]) => void
  addWatchlistGroup: (group: WatchlistGroup) => void
  removeWatchlistGroup: (groupId: number) => void
  addStockToGroup: (groupId: number, stock: any) => void
  removeStockFromGroup: (groupId: number, stockCode: string) => void
  addPriceAlert: (alert: PriceAlert) => void
  removePriceAlert: (alertId: number) => void
  triggerPriceAlert: (alertId: number) => void
  showLoginModal: () => void
  hideLoginModal: () => void
  showRegisterModal: () => void
  hideRegisterModal: () => void
  showGroupModal: () => void
  hideGroupModal: () => void
  showAlertModal: () => void
  hideAlertModal: () => void
  login: (user: User) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  watchlist: [],
  priceAlerts: [],
  loginModalVisible: false,
  registerModalVisible: false,
  groupModalVisible: false,
  alertModalVisible: false,

  setUser: (user) => set({ user }),
  setWatchlist: (watchlist) => set({ watchlist }),
  setPriceAlerts: (alerts) => set({ priceAlerts: alerts }),
  
  addWatchlistGroup: (group) => set((state) => ({
    watchlist: [...state.watchlist, group]
  })),
  
  removeWatchlistGroup: (groupId) => set((state) => ({
    watchlist: state.watchlist.filter(g => g.id !== groupId)
  })),
  
  addStockToGroup: (groupId, stock) => set((state) => ({
    watchlist: state.watchlist.map(g => 
      g.id === groupId 
        ? { ...g, stocks: [...g.stocks, stock] }
        : g
    )
  })),
  
  removeStockFromGroup: (groupId, stockCode) => set((state) => ({
    watchlist: state.watchlist.map(g => 
      g.id === groupId 
        ? { ...g, stocks: g.stocks.filter(s => s.code !== stockCode) }
        : g
    )
  })),
  
  addPriceAlert: (alert) => set((state) => ({
    priceAlerts: [...state.priceAlerts, alert]
  })),
  
  removePriceAlert: (alertId) => set((state) => ({
    priceAlerts: state.priceAlerts.filter(a => a.id !== alertId)
  })),
  
  triggerPriceAlert: (alertId) => set((state) => ({
    priceAlerts: state.priceAlerts.map(a =>
      a.id === alertId ? { ...a, isTriggered: true } : a
    )
  })),

  showLoginModal: () => set({ loginModalVisible: true }),
  hideLoginModal: () => set({ loginModalVisible: false }),
  showRegisterModal: () => set({ registerModalVisible: true }),
  hideRegisterModal: () => set({ registerModalVisible: false }),
  showGroupModal: () => set({ groupModalVisible: true }),
  hideGroupModal: () => set({ groupModalVisible: false }),
  showAlertModal: () => set({ alertModalVisible: true }),
  hideAlertModal: () => set({ alertModalVisible: false }),

  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ 
    user: null, 
    isLoggedIn: false, 
    watchlist: [], 
    priceAlerts: [] 
  })
}))
