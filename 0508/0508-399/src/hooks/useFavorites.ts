import { useState, useEffect } from 'react';

const STORAGE_KEY = 'plaque-favorites';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavoriteIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favoriteIds]);

  const toggleFavorite = (plaqueId: string) => {
    setFavoriteIds(prev =>
      prev.includes(plaqueId)
        ? prev.filter(id => id !== plaqueId)
        : [...prev, plaqueId]
    );
  };

  const isFavorite = (plaqueId: string) => favoriteIds.includes(plaqueId);

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite
  };
}
