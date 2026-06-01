import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { UsbPacket, InjectionRecord, SessionInfo, PacketQueryFilter, InjectionQueryFilter } from "../types";

interface UseStorageReturn {
  queryPackets: (filter: PacketQueryFilter) => Promise<UsbPacket[]>;
  queryInjectionRecords: (filter: InjectionQueryFilter) => Promise<InjectionRecord[]>;
  getSessions: () => Promise<SessionInfo[]>;
  exportPcapng: (sessionIds: string[], outputPath: string) => Promise<void>;
  replaySession: (sessionId: string) => Promise<UsbPacket[]>;
  packetResults: UsbPacket[];
  injectionResults: InjectionRecord[];
  sessions: SessionInfo[];
  isLoading: boolean;
  error: string | null;
}

export function useStorage(): UseStorageReturn {
  const [packetResults, setPacketResults] = useState<UsbPacket[]>([]);
  const [injectionResults, setInjectionResults] = useState<InjectionRecord[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryPackets = useCallback(async (filter: PacketQueryFilter): Promise<UsbPacket[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await invoke<UsbPacket[]>("query_packets", { filter });
      setPacketResults(results);
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const queryInjectionRecords = useCallback(async (filter: InjectionQueryFilter): Promise<InjectionRecord[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await invoke<InjectionRecord[]>("query_injection_records", { filter });
      setInjectionResults(results);
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSessions = useCallback(async (): Promise<SessionInfo[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await invoke<SessionInfo[]>("get_sessions");
      setSessions(results);
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportPcapng = useCallback(async (sessionIds: string[], outputPath: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await invoke("export_pcapng", { sessionIds, outputPath });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const replaySession = useCallback(async (sessionId: string): Promise<UsbPacket[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await invoke<UsbPacket[]>("replay_session", { sessionId });
      setPacketResults(results);
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    queryPackets,
    queryInjectionRecords,
    getSessions,
    exportPcapng,
    replaySession,
    packetResults,
    injectionResults,
    sessions,
    isLoading,
    error,
  };
}
