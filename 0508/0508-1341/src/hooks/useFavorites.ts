import { create } from 'zustand'
import type { FavoriteItem } from '@/types'

interface FavoritesState {
  favorites: FavoriteItem[]
  addFavorite: (item: Omit<FavoriteItem, 'id' | 'createdAt'>) => void
  removeFavorite: (id: string) => void
  clearFavorites: () => void
}

function loadFavorites(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem('ancient-measure-favorites')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFavorites(favorites: FavoriteItem[]) {
  try {
    localStorage.setItem('ancient-measure-favorites', JSON.stringify(favorites))
  } catch {
    // ignore
  }
}

export const useFavorites = create<FavoritesState>((set) => ({
  favorites: loadFavorites(),
  addFavorite: (item) =>
    set((state) => {
      const newItem: FavoriteItem = {
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: Date.now(),
      }
      const updated = [newItem, ...state.favorites]
      saveFavorites(updated)
      return { favorites: updated }
    }),
  removeFavorite: (id) =>
    set((state) => {
      const updated = state.favorites.filter((f) => f.id !== id)
      saveFavorites(updated)
      return { favorites: updated }
    }),
  clearFavorites: () =>
    set(() => {
      saveFavorites([])
      return { favorites: [] }
    }),
}))
