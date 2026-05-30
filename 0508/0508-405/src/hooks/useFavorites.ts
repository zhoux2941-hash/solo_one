import { useState, useEffect } from 'react';
import { Favorite } from '../types';

const STORAGE_KEY = 'park-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites from localStorage');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (parkId: string) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.parkId === parkId)) {
        return prev;
      }
      return [...prev, { parkId, createdAt: Date.now() }];
    });
  };

  const removeFavorite = (parkId: string) => {
    setFavorites((prev) => prev.filter((f) => f.parkId !== parkId));
  };

  const toggleFavorite = (parkId: string) => {
    if (isFavorite(parkId)) {
      removeFavorite(parkId);
    } else {
      addFavorite(parkId);
    }
  };

  const isFavorite = (parkId: string) => {
    return favorites.some((f) => f.parkId === parkId);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
