import { ViewState } from '../types/fractal';

interface CacheEntry {
  data: Float32Array;
  width: number;
  height: number;
  timestamp: number;
}

let cacheVersion = 0;
const cacheListeners = new Set<() => void>();

export function subscribeCacheSize(cb: () => void): () => void {
  cacheListeners.add(cb);
  return () => cacheListeners.delete(cb);
}

export function getCacheSizeSnapshot(): number {
  void cacheVersion;
  return globalTileCache.size;
}

export function bumpCacheVersion(): void {
  cacheVersion++;
  cacheListeners.forEach((l) => l());
}

function makeCacheKey(
  vs: ViewState,
  startX: number,
  startY: number,
  canvasWidth: number,
  canvasHeight: number
): string {
  return [
    vs.centerX.toPrecision(12),
    vs.centerY.toPrecision(12),
    vs.zoom.toPrecision(12),
    startX,
    startY,
    canvasWidth,
    canvasHeight,
  ].join('|');
}

const MAX_CACHE_ENTRIES = 512;

export class TileCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  get(
    vs: ViewState,
    startX: number,
    startY: number,
    canvasWidth: number,
    canvasHeight: number
  ): CacheEntry | null {
    const key = makeCacheKey(vs, startX, startY, canvasWidth, canvasHeight);
    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now();
      const idx = this.accessOrder.indexOf(key);
      if (idx !== -1) {
        this.accessOrder.splice(idx, 1);
        this.accessOrder.push(key);
      }
      return entry;
    }
    return null;
  }

  set(
    vs: ViewState,
    startX: number,
    startY: number,
    canvasWidth: number,
    canvasHeight: number,
    data: Float32Array,
    width: number,
    height: number
  ): void {
    const key = makeCacheKey(vs, startX, startY, canvasWidth, canvasHeight);
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      existing.data = data;
      existing.timestamp = Date.now();
      return;
    }

    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      this.evict();
    }

    this.cache.set(key, { data, width, height, timestamp: Date.now() });
    this.accessOrder.push(key);
  }

  has(
    vs: ViewState,
    startX: number,
    startY: number,
    canvasWidth: number,
    canvasHeight: number
  ): boolean {
    const key = makeCacheKey(vs, startX, startY, canvasWidth, canvasHeight);
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  get size(): number {
    return this.cache.size;
  }

  private evict(): void {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export const globalTileCache = new TileCache();
