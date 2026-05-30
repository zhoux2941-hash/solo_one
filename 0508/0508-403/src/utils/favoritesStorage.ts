import type { FavoriteRoute } from '@/types';

const STORAGE_KEY = 'hsr_favorites';

export function loadFavorites(): FavoriteRoute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoriteRoute[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function addFavorite(fromStationId: string, toStationId: string, fromName: string, toName: string): FavoriteRoute {
  const favorites = loadFavorites();
  const exists = favorites.find(
    (f) => f.fromStationId === fromStationId && f.toStationId === toStationId
  );
  if (exists) return exists;

  const newFav: FavoriteRoute = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fromStationId,
    toStationId,
    fromName,
    toName,
    createdAt: Date.now(),
  };
  favorites.push(newFav);
  saveFavorites(favorites);
  return newFav;
}

export function removeFavorite(id: string): void {
  const favorites = loadFavorites().filter((f) => f.id !== id);
  saveFavorites(favorites);
}

export function isFavorite(fromStationId: string, toStationId: string): boolean {
  const favorites = loadFavorites();
  return favorites.some(
    (f) => f.fromStationId === fromStationId && f.toStationId === toStationId
  );
}
