import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { InjectionConfig, InjectionRecord } from "../types";
import { DEFAULT_INJECTION_CONFIG } from "../types";

interface UseInjectionReturn {
  isInjectionActive: boolean;
  injectionConfig: InjectionConfig;
  injectionCount: number;
  injectionRecords: InjectionRecord[];
  seenPackets: number;
  startInjection: (config: InjectionConfig) => Promise<void>;
  stopInjection: () => Promise<void>;
  updateConfig: (config: Partial<InjectionConfig>) => void;
  resetConfig: () => void;
}

export function useInjection(): UseInjectionReturn {
  const [isInjectionActive, setIsInjectionActive] = useState(false);
  const [injectionConfig, setInjectionConfig] = useState<InjectionConfig>(DEFAULT_INJECTION_CONFIG);
  const [injectionCount, setInjectionCount] = useState(0);
  const [injectionRecords, setInjectionRecords] = useState<InjectionRecord[]>([]);
  const [seenPackets, setSeenPackets] = useState(0);
  const recordListenerRef = useRef<UnlistenFn | null>(null);
  const countListenerRef = useRef<UnlistenFn | null>(null);
  const seenListenerRef = useRef<UnlistenFn | null>(null);

  const startInjection = useCallback(async (config: InjectionConfig) => {
    try {
      setSeenPackets(0);
      setInjectionCount(0);
      setInjectionRecords([]);
      await invoke("start_injection", { config });
      setIsInjectionActive(true);

      const unlistenRecord = await listen<InjectionRecord>("injection-record", (event) => {
        setInjectionRecords((prev) => [...prev, event.payload]);
      });
      recordListenerRef.current = unlistenRecord;

      const unlistenCount = await listen<number>("injection-count", () => {
        setInjectionCount((prev) => prev + 1);
      });
      countListenerRef.current = unlistenCount;

      const unlistenSeen = await listen<number>("injection-seen-packets", (event) => {
        setSeenPackets(event.payload);
      });
      seenListenerRef.current = unlistenSeen;
    } catch (error) {
      console.error("Failed to start injection:", error);
      throw error;
    }
  }, []);

  const stopInjection = useCallback(async () => {
    try {
      await invoke("stop_injection");
      setIsInjectionActive(false);
      if (recordListenerRef.current) {
        recordListenerRef.current();
        recordListenerRef.current = null;
      }
      if (countListenerRef.current) {
        countListenerRef.current();
        countListenerRef.current = null;
      }
      if (seenListenerRef.current) {
        seenListenerRef.current();
        seenListenerRef.current = null;
      }
    } catch (error) {
      console.error("Failed to stop injection:", error);
      throw error;
    }
  }, []);

  const updateConfig = useCallback((partial: Partial<InjectionConfig>) => {
    setInjectionConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetConfig = useCallback(() => {
    setInjectionConfig(DEFAULT_INJECTION_CONFIG);
  }, []);

  useEffect(() => {
    return () => {
      if (recordListenerRef.current) {
        recordListenerRef.current();
      }
      if (countListenerRef.current) {
        countListenerRef.current();
      }
      if (seenListenerRef.current) {
        seenListenerRef.current();
      }
    };
  }, []);

  return {
    isInjectionActive,
    injectionConfig,
    injectionCount,
    injectionRecords,
    seenPackets,
    startInjection,
    stopInjection,
    updateConfig,
    resetConfig,
  };
}
