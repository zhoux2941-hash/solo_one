import { create } from 'zustand';
import { LRUCache, type CacheEntry } from '@/utils/lru-cache';

export interface LogEntry {
  id: number;
  timestamp: number;
  type: 'put' | 'get' | 'evict' | 'expire' | 'reset' | 'info';
  key: string;
  value?: string;
  result: string;
}

interface CacheState {
  capacity: number;
  hits: number;
  misses: number;
  log: LogEntry[];
  cacheItems: CacheEntry[];
  logCounter: number;
  now: number;

  setCapacity: (cap: number) => void;
  put: (key: string, value: string, ttl?: number) => void;
  get: (key: string) => void;
  reset: () => void;
  tick: () => void;
}

let lruEngine = new LRUCache(3);

const useCacheStore = create<CacheState>((set, get) => ({
  capacity: 3,
  hits: 0,
  misses: 0,
  log: [],
  cacheItems: [],
  logCounter: 0,
  now: Date.now(),

  setCapacity: (cap: number) => {
    lruEngine.reset(cap);
    set({
      capacity: cap,
      hits: 0,
      misses: 0,
      log: [],
      cacheItems: [],
      logCounter: 0,
    });
    const entry: LogEntry = {
      id: 0,
      timestamp: Date.now(),
      type: 'info',
      key: '',
      result: `容量已设置为 ${cap}，缓存已重置`,
    };
    set((s) => ({
      log: [entry, ...s.log],
      logCounter: s.logCounter + 1,
    }));
  },

  put: (key: string, value: string, ttl?: number) => {
    const evictedKey = lruEngine.put(key, value, ttl);
    const items = lruEngine.getOrder();

    const newLogs: LogEntry[] = [];

    if (evictedKey !== null) {
      newLogs.push({
        id: get().logCounter,
        timestamp: Date.now(),
        type: 'evict',
        key: evictedKey,
        result: `淘汰最久未使用: ${evictedKey}`,
      });
    }

    const ttlInfo = ttl && ttl > 0 ? ` (TTL: ${ttl}s)` : '';
    newLogs.push({
      id: get().logCounter + (newLogs.length > 0 ? 1 : 0),
      timestamp: Date.now(),
      type: 'put',
      key,
      value,
      result: `PUT(${key}, ${value}${ttl && ttl > 0 ? `, TTL=${ttl}s` : ''}) → 已存入${ttlInfo}`,
    });

    set((s) => ({
      cacheItems: items,
      log: [...newLogs.reverse(), ...s.log],
      logCounter: s.logCounter + newLogs.length,
    }));
  },

  get: (key: string) => {
    const result = lruEngine.get(key);
    const items = lruEngine.getOrder();

    if (result.expired) {
      const entry: LogEntry = {
        id: get().logCounter,
        timestamp: Date.now(),
        type: 'expire',
        key,
        result: `GET(${key}) → 已过期，自动移除`,
      };
      set((s) => ({
        misses: s.misses + 1,
        cacheItems: items,
        log: [entry, ...s.log],
        logCounter: s.logCounter + 1,
      }));
    } else if (result.value !== null) {
      const entry: LogEntry = {
        id: get().logCounter,
        timestamp: Date.now(),
        type: 'get',
        key,
        value: result.value,
        result: `GET(${key}) → 命中: ${result.value}`,
      };
      set((s) => ({
        hits: s.hits + 1,
        cacheItems: items,
        log: [entry, ...s.log],
        logCounter: s.logCounter + 1,
      }));
    } else {
      const entry: LogEntry = {
        id: get().logCounter,
        timestamp: Date.now(),
        type: 'get',
        key,
        result: `GET(${key}) → 未命中`,
      };
      set((s) => ({
        misses: s.misses + 1,
        cacheItems: items,
        log: [entry, ...s.log],
        logCounter: s.logCounter + 1,
      }));
    }
  },

  reset: () => {
    lruEngine.reset();
    set({
      hits: 0,
      misses: 0,
      log: [],
      cacheItems: [],
      logCounter: 0,
    });
    const entry: LogEntry = {
      id: 0,
      timestamp: Date.now(),
      type: 'reset',
      key: '',
      result: '缓存已重置',
    };
    set((s) => ({
      log: [entry, ...s.log],
      logCounter: s.logCounter + 1,
    }));
  },

  tick: () => {
    const expiredKeys = lruEngine.removeExpired();
    if (expiredKeys.length === 0) {
      set({ now: Date.now() });
      return;
    }

    const items = lruEngine.getOrder();
    const newLogs: LogEntry[] = expiredKeys.map((key, i) => ({
      id: get().logCounter + i,
      timestamp: Date.now(),
      type: 'expire' as const,
      key,
      result: `TTL到期: ${key} 已自动失效`,
    }));

    set((s) => ({
      cacheItems: items,
      now: Date.now(),
      log: [...newLogs.reverse(), ...s.log],
      logCounter: s.logCounter + newLogs.length,
    }));
  },
}));

export default useCacheStore;
